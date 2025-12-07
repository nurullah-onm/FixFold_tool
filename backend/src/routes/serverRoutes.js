import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  listServers,
  getServer,
  createServer,
  updateServer,
  deleteServer,
  healthCheck,
  getServerStats,
  syncConfig,
  autoBalance,
  assignClient,
  migrateClient
} from '../controllers/serverController.js';
import {
  validateServerCreate,
  validateServerUpdate,
  validateAssign,
  validateMigrate
} from '../validators/serverValidator.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/', listServers);
router.get('/:id', getServer);
router.post('/', validateServerCreate, createServer);
router.put('/:id', validateServerUpdate, updateServer);
router.delete('/:id', deleteServer);
router.post('/:id/health-check', healthCheck);
router.get('/:id/stats', getServerStats);
router.post('/:id/sync-config', syncConfig);
router.post('/auto-balance', autoBalance);
router.post('/client/:clientId/assign', validateAssign, assignClient);
router.post('/client/:clientId/migrate', validateMigrate, migrateClient);

export default router;
