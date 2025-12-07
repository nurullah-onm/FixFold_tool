import xrayManager from '../services/xray/xrayManager.js';
import * as xrayConfigService from '../services/xray/xrayConfigService.js';
import * as xrayStatsService from '../services/xray/xrayStatsService.js';
import logger from '../utils/logger.js';

export const getStatus = async (req, res, next) => {
  try {
    const status = xrayManager.getStatus();
    const version = await xrayManager.getVersion().catch(() => 'unknown');
    return res.json({ success: true, data: { ...status, version } });
  } catch (error) {
    logger.error(`Status error: ${error.message}`);
    return next(error);
  }
};

export const start = async (req, res, next) => {
  try {
    const status = await xrayManager.startXray();
    return res.json({ success: true, data: status });
  } catch (error) {
    logger.error(`Start error: ${error.message}`);
    return next(error);
  }
};

export const stop = async (req, res, next) => {
  try {
    const status = await xrayManager.stopXray();
    return res.json({ success: true, data: status });
  } catch (error) {
    logger.error(`Stop error: ${error.message}`);
    return next(error);
  }
};

export const restart = async (req, res, next) => {
  try {
    const status = await xrayManager.restartXray();
    return res.json({ success: true, data: status });
  } catch (error) {
    logger.error(`Restart error: ${error.message}`);
    return next(error);
  }
};

export const getVersion = async (req, res, next) => {
  try {
    const version = await xrayManager.getVersion();
    return res.json({ success: true, data: { version } });
  } catch (error) {
    logger.error(`Version error: ${error.message}`);
    return next(error);
  }
};

export const getConfig = async (req, res, next) => {
  try {
    const config = await xrayConfigService.getActiveConfig();
    return res.json({ success: true, data: config });
  } catch (error) {
    logger.error(`Get config error: ${error.message}`);
    return next(error);
  }
};

export const saveConfig = async (req, res, next) => {
  try {
    const config = await xrayConfigService.saveConfig(req.body);
    return res.status(201).json({ success: true, data: config });
  } catch (error) {
    logger.error(`Save config error: ${error.message}`);
    return next(error);
  }
};

export const testConfig = async (req, res, next) => {
  try {
    const pathToTest = req.body?.configPath;
    const result = await xrayManager.testConfig(pathToTest);
    return res.json({ success: true, data: { result } });
  } catch (error) {
    logger.error(`Test config error: ${error.message}`);
    return next(error);
  }
};

export const reloadConfig = async (req, res, next) => {
  try {
    await xrayManager.reloadConfig();
    return res.json({ success: true, data: { message: 'Reload signal sent' } });
  } catch (error) {
    logger.error(`Reload error: ${error.message}`);
    return next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await xrayStatsService.getAllStats();
    const system = xrayStatsService.getSystemStats();
    return res.json({ success: true, data: { stats, system } });
  } catch (error) {
    logger.error(`Stats error: ${error.message}`);
    return next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const { email } = req.params;
    const stats = await xrayStatsService.getUserStats(email);
    return res.json({ success: true, data: stats });
  } catch (error) {
    logger.error(`User stats error: ${error.message}`);
    return next(error);
  }
};

export const resetUserStats = async (req, res, next) => {
  try {
    const { email } = req.params;
    const stats = await xrayStatsService.resetStats(email);
    return res.json({ success: true, data: stats });
  } catch (error) {
    logger.error(`Reset stats error: ${error.message}`);
    return next(error);
  }
};
