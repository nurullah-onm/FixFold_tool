import { Router } from 'express';
import {
  getStatus,
  start,
  stop,
  restart,
  getVersion,
  getConfig,
  saveConfig,
  testConfig,
  reloadConfig,
  getStats,
  getUserStats,
  resetUserStats
} from '../controllers/xrayController.js';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import { validateConfigRequest } from '../validators/xrayValidator.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/status', getStatus);
router.post('/start', start);
router.post('/stop', stop);
router.post('/restart', restart);
router.get('/version', getVersion);

router.get('/config', getConfig);
router.post('/config', validateConfigRequest, saveConfig);
router.post('/config/test', testConfig);
router.post('/config/reload', reloadConfig);

router.get('/stats', getStats);
router.get('/stats/:email', getUserStats);
router.post('/stats/reset/:email', resetUserStats);

export default router;
