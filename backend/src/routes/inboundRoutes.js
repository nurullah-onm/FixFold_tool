import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  createInbound,
  getInbounds,
  getInboundById,
  updateInbound,
  deleteInbound,
  toggleInbound,
  restartInbound,
  getInboundStats
} from '../controllers/inboundController.js';
import { validateInbound, validateInboundUpdate } from '../validators/inboundValidator.js';

const router = Router();

router.use(verifyToken);

router.post('/', requireAdmin, validateInbound, createInbound);
router.delete('/:id', requireAdmin, deleteInbound);

router.get('/', getInbounds);
router.put('/:id', validateInboundUpdate, updateInbound);
router.post('/:id/toggle', toggleInbound);
router.post('/:id/restart', requireAdmin, restartInbound);
router.get('/:id/stats', getInboundStats);
router.get('/:id', getInboundById);

export default router;
