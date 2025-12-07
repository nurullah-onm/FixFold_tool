import cron from 'node-cron';
import trafficCollector from '../services/ai/trafficCollector.js';
import anomalyDetector from '../services/ai/anomalyDetector.js';
import logger from '../utils/logger.js';

export const trafficCollectionJob = cron.schedule('*/30 * * * * *', async () => {
  await trafficCollector.collectSnapshots();
});

export const anomalyDetectionJob = cron.schedule('*/2 * * * *', async () => {
  try {
    const anomalies = await anomalyDetector.detectAnomalies();
    if (anomalies.length > 0) {
      logger.warn(`Detected ${anomalies.length} new anomalies`);
    }
  } catch (error) {
    logger.error(`Anomaly detection job error: ${error.message}`);
  }
});

export const modelRetrainingJob = cron.schedule('0 3 * * 0', async () => {
  try {
    logger.info('Starting weekly model retraining...');
    await anomalyDetector.trainModel();
  } catch (error) {
    logger.error(`Model retraining error: ${error.message}`);
  }
});

export default {
  trafficCollectionJob,
  anomalyDetectionJob,
  modelRetrainingJob
};
