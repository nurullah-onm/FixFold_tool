import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createClient,
  bulkCreateClients,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  toggleClient,
  resetClientTraffic,
  getClientStats,
  getClientQRCode,
  getClientSubscriptionLink
} from '../controllers/clientController.js';
import { validateCreateClient, validateUpdateClient, validateBulkCreate } from '../validators/clientValidator.js';

const router = Router();

router.use(verifyToken);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', validateCreateClient, createClient);
router.post('/bulk', validateBulkCreate, bulkCreateClients);
router.put('/:id', validateUpdateClient, updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/toggle', toggleClient);
router.post('/:id/reset-traffic', resetClientTraffic);
router.get('/:id/stats', getClientStats);
router.get('/:id/qrcode', getClientQRCode);
router.get('/:id/subscription', getClientSubscriptionLink);

export default router;
