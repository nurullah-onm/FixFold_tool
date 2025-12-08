import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import extract from 'extract-zip';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

class XrayManager extends EventEmitter {
  constructor() {
    super();
    this.binPath = env.xray.binPath;
    this.configPath = env.xray.configPath;
    this.process = null;
    this.startedAt = null;
    this.restartAttempts = 0;
    this.restartMax = env.xray.restartMaxAttempts || 5;
    this.autoRestart = env.xray.autoRestart;
    this.stopping = false;
  }

  async downloadXray() {
    const platform = os.platform();
    const arch = os.arch();
    const mappedArch = arch === 'x64' ? '64' : arch === 'arm64' ? 'arm64-v8a' : '64';
    const mappedOs = platform === 'win32' ? 'windows' : platform === 'darwin' ? 'macos' : 'linux';
    const latestRes = await fetch('https://api.github.com/repos/XTLS/Xray-core/releases/latest');
    const latest = await latestRes.json();
    const version = latest.tag_name;
    const asset = latest.assets?.find((a) => a.name.includes(`Xray-${mappedOs}-${mappedArch}.zip`));
    if (!asset) throw new Error('Suitable Xray binary not found for platform');

    const tmpZip = path.join(os.tmpdir(), `xray-${Date.now()}.zip`);
    const zipBuf = Buffer.from(await (await fetch(asset.browser_download_url)).arrayBuffer());
    await fs.writeFile(tmpZip, zipBuf);

    const extractDir = path.join(os.tmpdir(), `xray-${Date.now()}`);
    await extract(tmpZip, { dir: extractDir });
    const binName = platform === 'win32' ? 'xray.exe' : 'xray';
    const extractedPath = path.join(extractDir, binName);
    await fs.copyFile(extractedPath, this.binPath);
    await fs.chmod(this.binPath, 0o755);
    await fs.unlink(tmpZip);
    logger.info(`Downloaded Xray ${version} to ${this.binPath}`);
    return version;
  }

  async startXray() {
    if (this.process) {
      logger.warn('Xray already running');
      return this.getStatus();
    }

    await this.ensureConfigExists();

    this.process = spawn(this.binPath, ['run', '-c', this.configPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.startedAt = Date.now();
    this.process.stdout.on('data', (data) => logger.info(`[xray] ${data.toString().trim()}`));
    this.process.stderr.on('data', (data) => logger.error(`[xray] ${data.toString().trim()}`));
    this.process.on('close', (code) => this.handleExit(code));
    this.process.on('error', (err) => this.handleError(err));

    this.emit('xray:started', { pid: this.process.pid });
    logger.info(`Xray started with PID ${this.process.pid}`);
    this.restartAttempts = 0;
    return this.getStatus();
  }

  handleExit(code) {
    logger.warn(`Xray exited with code ${code}`);
    this.emit('xray:stopped', { code });
    this.process = null;
    if (this.stopping) {
      this.stopping = false;
    }
    if (!this.stopping && this.autoRestart && this.restartAttempts < this.restartMax) {
      const backoff = Math.min(30000, (2 ** this.restartAttempts) * 1000);
      this.restartAttempts += 1;
      setTimeout(() => {
        this.startXray().catch((err) => logger.error(`Auto-restart failed: ${err.message}`));
      }, backoff);
    }
  }

  handleError(err) {
    logger.error(`Xray process error: ${err.message}`);
    this.emit('xray:error', err);
  }

  async stopXray() {
    if (!this.process) {
      logger.warn('Xray not running');
      return { running: false };
    }

    return new Promise((resolve) => {
      this.stopping = true;
      const proc = this.process;
      proc.once('close', () => resolve({ running: false }));
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  async restartXray() {
    await this.stopXray();
    return this.startXray();
  }

  async getVersion() {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binPath, ['-version']);
      let output = '';
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      proc.on('close', (code) => {
        if (code === 0) resolve(output.trim());
        else reject(new Error('Failed to get Xray version'));
      });
      proc.on('error', reject);
    });
  }

  async testConfig(configPath = this.configPath) {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.binPath, ['run', '-test', '-c', configPath]);
      let output = '';
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { output += data.toString(); });
      proc.on('close', (code) => {
        if (code === 0) resolve(output.trim());
        else reject(new Error(`Config test failed: ${output}`));
      });
      proc.on('error', reject);
    });
  }

  async reloadConfig() {
    if (this.process?.pid) {
      try {
        process.kill(this.process.pid, 'SIGHUP');
        logger.info('Sent HUP to Xray for config reload');
        return true;
      } catch (err) {
        logger.error(`Failed to reload config: ${err.message}`);
        throw err;
      }
    }
    return this.startXray();
  }

  async ensureConfigExists() {
    try {
      await fs.access(this.configPath);
    } catch (err) {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify({}));
    }
  }

  getStatus() {
    const running = !!this.process;
    const uptime = running && this.startedAt ? Date.now() - this.startedAt : 0;
    return {
      running,
      pid: this.process?.pid || null,
      uptime,
      restartAttempts: this.restartAttempts
    };
  }
}

const xrayManager = new XrayManager();
export default xrayManager;
