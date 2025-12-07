import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import './jobs/trafficSyncJob.js';
import './jobs/expiredClientsJob.js';
import anomalyDetector from './services/ai/anomalyDetector.js';
import { trafficCollectionJob, anomalyDetectionJob, modelRetrainingJob } from './jobs/aiJobs.js';
import { serverHealthCheckJob, autoBalanceJob } from './jobs/serverJobs.js';
import { startTelegramBot } from './services/telegram/telegramBot.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connected to FixFold realtime channel' });
});

server.listen(env.port, () => {
  logger.info(`FixFold API listening on port ${env.port}`);
});

startTelegramBot();

anomalyDetector.initialize().catch((err) => logger.error(`Anomaly detector init failed: ${err.message}`));
trafficCollectionJob.start();
anomalyDetectionJob.start();
modelRetrainingJob.start();
serverHealthCheckJob.start();
autoBalanceJob.start();
