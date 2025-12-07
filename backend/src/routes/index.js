import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import xrayRoutes from './xrayRoutes.js';
import inboundRoutes from './inboundRoutes.js';
import clientRoutes from './clientRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import aiRoutes from './aiRoutes.js';
import serverRoutes from './serverRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/xray', xrayRoutes);
router.use('/inbounds', inboundRoutes);
router.use('/clients', clientRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/ai', aiRoutes);
router.use('/servers', serverRoutes);
router.use('/settings', settingsRoutes);

export default router;
