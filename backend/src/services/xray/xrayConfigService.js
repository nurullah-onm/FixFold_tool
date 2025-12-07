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

export const saveConfig = async (configData) => {
  try {
    const validated = validateConfig(configData);
    await prisma.xrayConfig.updateMany({ data: { isActive: false } });
    const saved = await prisma.xrayConfig.create({ data: { ...validated, isActive: true } });

    await writeConfigFile(validated);
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
    await writeConfigFile(config);
    await xrayManager.testConfig(env.xray.configPath);
    await xrayManager.reloadConfig();
    logger.info(`Applied config ${configId}`);
    return config;
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
  await writeConfigFile(active);
  return active;
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
