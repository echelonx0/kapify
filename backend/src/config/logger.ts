// Production Monitoring & Logging Strategy for Kapify Platform

// 1. LOGGING ARCHITECTURE
// backend/src/config/logger.ts (Enhanced Production Version)

import winston from 'winston';
import 'winston-daily-rotate-file';

const logLevel = process.env.LOG_LEVEL || 'info';
const environment = process.env.NODE_ENV || 'development';

// Custom log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      '@timestamp': timestamp,
      level,
      message,
      environment,
      service: 'kapify-backend',
      ...meta
    });
  })
);

// Production transports
const transports: winston.transport[] = [
  // Console logging
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Production file logging with rotation
if (environment === 'production') {
  transports.push(
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '100m',
      maxFiles: '30d',
      format: logFormat
    }),
    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxFiles: '30d',
      format: logFormat
    }),
    // Application performance logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/performance-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '50m',
      maxFiles: '14d',
      format: logFormat
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { 
    service: 'kapify-backend',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports,
  exitOnError: false
});
