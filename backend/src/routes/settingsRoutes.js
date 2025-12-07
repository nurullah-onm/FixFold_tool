import { Router } from 'express';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(verifyToken, requireRole(['ADMIN']));
router.post('/update', updateSettings);

export default router;
