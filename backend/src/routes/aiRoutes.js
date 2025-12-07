import { Router } from 'express';
import {
  listAnomalies,
  getAnomaly,
  resolveAnomaly,
  getStats,
  trainModel,
  getModelInfo
} from '../controllers/aiController.js';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/anomalies', listAnomalies);
router.get('/anomalies/:id', getAnomaly);
router.post('/anomalies/:id/resolve', resolveAnomaly);
router.get('/stats', getStats);
router.post('/train-model', trainModel);
router.get('/model-info', getModelInfo);

export default router;
