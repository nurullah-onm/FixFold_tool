import axios from 'axios';
import os from 'os';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

const apiClient = axios.create({
  baseURL: `http://${env.xray.apiHost}:${env.xray.apiPort}`,
  timeout: 5000
});

const sendCommand = async (payload) => {
  try {
    const { data } = await apiClient.post('/stats', payload);
    return data;
  } catch (error) {
    logger.error(`Xray stats request failed: ${error.message}`);
    const err = new Error('Failed to reach Xray stats API');
    err.status = 502;
    throw err;
  }
};

export const getUserStats = async (email) => {
  return sendCommand({
    command: 'QueryStats',
    pattern: `user>>>${email}>>>traffic>>>`,
    reset: false
  });
};

export const getInboundStats = async (tag) => {
  return sendCommand({
    command: 'QueryStats',
    pattern: `inbound>>>${tag}>>>traffic>>>`,
    reset: false
  });
};

export const getAllStats = async () => {
  return sendCommand({
    command: 'QueryStats',
    pattern: '',
    reset: false
  });
};

export const resetStats = async (email) => {
  return sendCommand({
    command: 'QueryStats',
    pattern: `user>>>${email}>>>traffic>>>`,
    reset: true
  });
};

export const getSystemStats = () => {
  const load = os.loadavg();
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  return {
    cpuLoad: load[0],
    memory: {
      total: memTotal,
      free: memFree,
      used: memTotal - memFree
    },
    uptime: os.uptime()
  };
};

export default {
  getUserStats,
  getInboundStats,
  getAllStats,
  resetStats,
  getSystemStats
};
