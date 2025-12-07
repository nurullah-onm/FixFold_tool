import cron from 'node-cron';
import inboundService from '../services/inbound/inboundService.js';
import logger from '../utils/logger.js';

const trafficSyncJob = cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('Starting traffic sync job...');
    const synced = await inboundService.syncTrafficFromXray();
    logger.info(`Traffic sync completed successfully for ${synced} inbounds`);
  } catch (error) {
    logger.error(`Traffic sync failed: ${error.message}`);
  }
});

export default trafficSyncJob;
