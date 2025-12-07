import {
  register as registerService,
  login as loginService,
  refreshToken as refreshTokenService,
  logout as logoutService,
  changePassword as changePasswordService
} from '../services/auth/authService.js';
import logger from '../utils/logger.js';

export const register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const result = await registerService(username, password, email);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error(`Register controller error: ${error.message}`);
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await loginService(username, password);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Login controller error: ${error.message}`);
    return next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshTokenService(refreshToken);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Refresh controller error: ${error.message}`);
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    await logoutService(userId);
    return res.json({ success: true, data: { message: 'Logged out' } });
  } catch (error) {
    logger.error(`Logout controller error: ${error.message}`);
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const { oldPassword, newPassword } = req.body;
    await changePasswordService(userId, oldPassword, newPassword);
    return res.json({ success: true, data: { message: 'Password changed' } });
  } catch (error) {
    logger.error(`Change password controller error: ${error.message}`);
    return next(error);
  }
};
