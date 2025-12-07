import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  changePassword
} from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateChangePassword
} from '../validators/authValidator.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefresh, refresh);
router.post('/logout', verifyToken, logout);
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

export default router;
