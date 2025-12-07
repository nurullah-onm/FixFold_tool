import cron from 'node-cron';
import clientService from '../services/client/clientService.js';
import logger from '../utils/logger.js';

const expiredClientsJob = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running expired clients check...');
    const result = await clientService.checkExpiredClients();
    logger.info(
      `Expired clients job completed. expired=${result.expiredCount}, overLimit=${result.overLimitCount}`
    );
  } catch (error) {
    logger.error(`Expired clients job failed: ${error.message}`);
  }
});

export default expiredClientsJob;
