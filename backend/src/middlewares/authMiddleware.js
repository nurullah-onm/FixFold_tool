import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import logger from '../utils/logger.js';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    return next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);

export default {
  verifyToken,
  requireRole,
  requireAdmin
};
