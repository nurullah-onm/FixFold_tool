import { Router } from 'express';
import { getPublicSubscription } from '../controllers/clientController.js';

const router = Router();

router.get('/:subId', getPublicSubscription);

export default router;
