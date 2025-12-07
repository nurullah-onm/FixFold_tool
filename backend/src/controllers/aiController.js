import prisma from '../config/prisma.js';
import anomalyDetector from '../services/ai/anomalyDetector.js';
import logger from '../utils/logger.js';

export const listAnomalies = async (req, res, next) => {
  try {
    const anomalies = await prisma.anomaly.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 200,
      include: { client: { select: { email: true, id: true, inboundId: true } } }
    });
    return res.json({ success: true, data: anomalies });
  } catch (error) {
    return next(error);
  }
};

export const getAnomaly = async (req, res, next) => {
  try {
    const anomaly = await prisma.anomaly.findUnique({
      where: { id: req.params.id },
      include: { client: { select: { email: true, id: true, inboundId: true } } }
    });
    if (!anomaly) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: anomaly });
  } catch (error) {
    return next(error);
  }
};

export const resolveAnomaly = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const anomaly = await anomalyDetector.resolveAnomaly(req.params.id, req.user?.sub, notes);
    return res.json({ success: true, data: anomaly });
  } catch (error) {
    return next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await anomalyDetector.getAnomalyStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
};

export const trainModel = async (req, res, next) => {
  try {
    await anomalyDetector.trainModel();
    return res.json({ success: true, data: { message: 'Training started' } });
  } catch (error) {
    logger.error(`Train model error: ${error.message}`);
    return next(error);
  }
};

export const getModelInfo = async (req, res, next) => {
  try {
    const info = await anomalyDetector.getModelInfo();
    return res.json({ success: true, data: info });
  } catch (error) {
    return next(error);
  }
};
