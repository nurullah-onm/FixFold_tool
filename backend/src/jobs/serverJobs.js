import cron from 'node-cron';
import serverManager from '../services/server/serverManager.js';
import logger from '../utils/logger.js';

export const serverHealthCheckJob = cron.schedule('*/1 * * * *', async () => {
  try {
    await serverManager.healthCheckAll();
  } catch (error) {
    logger.error(`Server health check job error: ${error.message}`);
  }
});

export const autoBalanceJob = cron.schedule('*/10 * * * *', async () => {
  try {
    await serverManager.autoBalance();
  } catch (error) {
    logger.error(`Auto-balance job error: ${error.message}`);
  }
});

export default {
  serverHealthCheckJob,
  autoBalanceJob
};
