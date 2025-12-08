import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

const REFRESH_BYTES = 40;

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const sanitizeUser = (user) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, username: user.username, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(REFRESH_BYTES).toString('hex');
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      expiresAt,
      userId
    }
  });

  return { token, expiresAt };
};

export const register = async (username, password, email) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existing) {
      throw createError('User already exists with that username or email', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { username, email, passwordHash }
    });

    const accessToken = signAccessToken(user);
    const refresh = await createRefreshToken(user.id);

    logger.info(`User registered: ${user.username}`);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt
    };
  } catch (error) {
    logger.error(`Register failed: ${error.message}`);
    throw error;
  }
};

export const login = async (username, password) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw createError('Kullanıcı adı veya şifre hatalı', 401);
    }

    if (!user.isActive) {
      throw createError('Kullanıcı pasif durumda', 403);
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw createError('Kullanıcı adı veya şifre hatalı', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const accessToken = signAccessToken(user);
    const refresh = await createRefreshToken(user.id);

    logger.info(`User login success: ${user.username}`);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt
    };
  } catch (error) {
    logger.error(`Login failed for ${username}: ${error.message}`);
    throw error;
  }
};

export const refreshToken = async (token) => {
  try {
    if (!token) throw createError('Refresh token required', 400);

    const tokenHash = hashRefreshToken(token);
    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!existing || !existing.user) {
      throw createError('Invalid refresh token', 401);
    }

    if (existing.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { tokenHash } });
      throw createError('Refresh token expired', 401);
    }

    const user = existing.user;
    if (!user.isActive) throw createError('User is inactive', 403);

    await prisma.refreshToken.delete({ where: { tokenHash } });
    const accessToken = signAccessToken(user);
    const refresh = await createRefreshToken(user.id);

    logger.info(`Refresh token rotated for user ${user.username}`);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt
    };
  } catch (error) {
    logger.error(`Refresh token failed: ${error.message}`);
    throw error;
  }
};

export const logout = async (userId) => {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    logger.info(`User logged out: ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Logout failed for ${userId}: ${error.message}`);
    throw error;
  }
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createError('User not found', 404);

    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) throw createError('Old password incorrect', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await prisma.refreshToken.deleteMany({ where: { userId } });
    logger.info(`Password changed for user ${user.username}`);

    return true;
  } catch (error) {
    logger.error(`Change password failed for ${userId}: ${error.message}`);
    throw error;
  }
};
