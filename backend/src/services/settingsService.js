import fs from 'fs/promises';
import path from 'path';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const ENV_PATH = path.resolve(process.cwd(), '.env');

const ALLOWED_KEYS = new Set([
  'SERVER_ADDRESS',
  'JWT_EXPIRES_IN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',
  'REDIS_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'TELEGRAM_ADMIN_IDS',
  'CLOUDFLARE_API_TOKEN',
  'CF_ZONE_ID',
  'XRAY_BIN_PATH',
  'XRAY_CONFIG_PATH'
]);

const parseEnvText = (text) => {
  const lines = text.split('\n');
  const map = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    map.set(key, val);
  }
  return map;
};

const serializeEnv = (map) => {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
};

export async function updateEnvSettings(updates) {
  try {
    const allowedUpdates = {};
    Object.entries(updates || {}).forEach(([k, v]) => {
      if (ALLOWED_KEYS.has(k)) {
        allowedUpdates[k] = v;
      }
    });
    const raw = await fs.readFile(ENV_PATH, 'utf-8');
    const map = parseEnvText(raw);
    Object.entries(allowedUpdates).forEach(([k, v]) => {
      map.set(k, String(v));
      process.env[k] = String(v);
      // also keep env object in sync for runtime usage
      if (k === 'SERVER_ADDRESS') env.serverAddress = String(v);
      if (k === 'JWT_EXPIRES_IN') env.jwtExpiresIn = String(v);
      if (k === 'RATE_LIMIT_WINDOW_MS') env.rateLimitWindowMs = Number(v);
      if (k === 'RATE_LIMIT_MAX') env.rateLimitMax = Number(v);
      if (k === 'REDIS_URL') process.env.REDIS_URL = String(v);
      if (k === 'TELEGRAM_BOT_TOKEN') env.telegram.botToken = String(v);
      if (k === 'TELEGRAM_CHAT_ID') env.telegram.chatId = String(v);
      if (k === 'TELEGRAM_ADMIN_IDS') env.telegram.adminIds = String(v).split(',').filter(Boolean);
      if (k === 'XRAY_BIN_PATH') env.xray.binPath = String(v);
      if (k === 'XRAY_CONFIG_PATH') env.xray.configPath = String(v);
      if (k === 'CLOUDFLARE_API_TOKEN') process.env.CLOUDFLARE_API_TOKEN = String(v);
      if (k === 'CF_ZONE_ID') process.env.CF_ZONE_ID = String(v);
    });
    const serialized = serializeEnv(map);
    await fs.writeFile(ENV_PATH, serialized, 'utf-8');
    logger.info('Env settings updated via panel');
    return allowedUpdates;
  } catch (err) {
    logger.error('Env update failed', err);
    throw err;
  }
}
