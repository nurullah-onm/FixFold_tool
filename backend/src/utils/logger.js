import winston from 'winston';
import env from '../config/env.js';

const logger = winston.createLogger({
  level: env.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `[${info.timestamp}] ${info.level}: ${info.message} ${info.stack ? info.stack : ''}`
        )
      )
    })
  ]
});

export default logger;
