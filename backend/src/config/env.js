import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  logLevel: process.env.LOG_LEVEL || 'info',
  serverAddress: process.env.SERVER_ADDRESS || 'localhost',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    adminIds: (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)
  },
  xray: {
    binPath: process.env.XRAY_BIN_PATH || '/usr/local/bin/xray',
    configPath: process.env.XRAY_CONFIG_PATH || '/etc/x-ui/config.json',
    apiHost: process.env.XRAY_API_HOST || '127.0.0.1',
    apiPort: Number(process.env.XRAY_API_PORT) || 62789,
    logLevel: process.env.XRAY_LOG_LEVEL || 'warning',
    autoRestart: String(process.env.XRAY_AUTO_RESTART || 'true').toLowerCase() === 'true',
    restartMaxAttempts: Number(process.env.XRAY_RESTART_MAX_ATTEMPTS) || 5
  }
};

export default env;
