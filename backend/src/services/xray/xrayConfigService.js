import { promises as fs } from 'fs';
import path from 'path';
import prisma from '../../config/prisma.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import xrayManager from './xrayManager.js';
import { configSchema } from '../../validators/xrayValidator.js';

const validateConfig = (config) => {
  const { error, value } = configSchema.validate(config);
  if (error) {
    const err = new Error(`Invalid config: ${error.message}`);
    err.status = 400;
    throw err;
  }
  return value;
};

const normalizeSockopt = (sockopt = {}) => {
  const normalized = { ...sockopt };
  // tproxy must be string: off | redirect | tproxy
  if (normalized.tproxy !== undefined) {
    const tv = normalized.tproxy;
    if (tv === true) normalized.tproxy = 'redirect';
    else if (tv === false || tv === null) normalized.tproxy = 'off';
    else if (typeof tv === 'string' && ['off', 'redirect', 'tproxy'].includes(tv)) {
      normalized.tproxy = tv;
    } else {
      normalized.tproxy = 'off';
    }
  }
  // mark must be number
  if (normalized.mark !== undefined && normalized.mark !== null && normalized.mark !== '') {
    const mk = Number(normalized.mark);
    normalized.mark = Number.isFinite(mk) ? mk : undefined;
  }
  return normalized;
};

const normalizeConfig = (config) => {
  const clone = { ...config, inbounds: Array.isArray(config.inbounds) ? [...config.inbounds] : [] };
  clone.inbounds = clone.inbounds.map((inb) => {
    const next = { ...inb };
    if (next.streamSettings && next.streamSettings.sockopt) {
      next.streamSettings = { ...next.streamSettings, sockopt: normalizeSockopt(next.streamSettings.sockopt) };
    }
    return next;
  });
  return clone;
};

export const saveConfig = async (configData) => {
  try {
    const validated = validateConfig(configData);
    const normalized = normalizeConfig(validated);
    await prisma.xrayConfig.updateMany({ data: { isActive: false } });
    const saved = await prisma.xrayConfig.create({ data: { ...normalized, isActive: true } });

    await writeConfigFile(normalized);
    logger.info(`Config saved and written to file: ${saved.id}`);
    return saved;
  } catch (error) {
    logger.error(`Save config failed: ${error.message}`);
    throw error;
  }
};

export const getActiveConfig = async () => {
  return prisma.xrayConfig.findFirst({ where: { isActive: true } });
};

export const applyConfig = async (configId) => {
  try {
    const config = await prisma.xrayConfig.findUnique({ where: { id: configId } });
    if (!config) {
      const err = new Error('Config not found');
      err.status = 404;
      throw err;
    }
    await prisma.xrayConfig.updateMany({ data: { isActive: false } });
    await prisma.xrayConfig.update({ where: { id: configId }, data: { isActive: true } });

    validateConfig(config);
    const normalized = normalizeConfig(config);
    await writeConfigFile(normalized);
    await xrayManager.testConfig(env.xray.configPath);
    await xrayManager.reloadConfig();
    logger.info(`Applied config ${configId}`);
    return normalized;
  } catch (error) {
    logger.error(`Apply config failed: ${error.message}`);
    throw error;
  }
};

export const backupConfig = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const target = path.join(backupDir, `xray-config-${timestamp}.json`);
    await fs.copyFile(env.xray.configPath, target);
    logger.info(`Config backed up to ${target}`);
    return target;
  } catch (error) {
    logger.error(`Backup config failed: ${error.message}`);
    throw error;
  }
};

export const syncConfigFromDB = async () => {
  const active = await getActiveConfig();
  if (!active) {
    const err = new Error('No active config found');
    err.status = 404;
    throw err;
  }
  validateConfig(active);
  const normalized = normalizeConfig(active);
  await writeConfigFile(normalized);
  return normalized;
};

export const writeConfigFile = async (config) => {
  const { id, createdAt, updatedAt, isActive, ...pureConfig } = config;
  const content = JSON.stringify(pureConfig, null, 2);
  await fs.mkdir(path.dirname(env.xray.configPath), { recursive: true });
  await fs.writeFile(env.xray.configPath, content, 'utf8');
  return true;
};

export default {
  saveConfig,
  getActiveConfig,
  applyConfig,
  backupConfig,
  validateConfig,
  syncConfigFromDB,
  writeConfigFile
};
