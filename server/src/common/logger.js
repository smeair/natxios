import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import winston from 'winston';
import env from '../config/env.js';

/*
 * Winston logger.
 *  - File: errors only, one minimal JSON line each, rotated by size (logs/error.log).
 *  - Console: readable output for development (info and above by default).
 */
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const LOG_DIR = path.resolve(serverRoot, env.LOG_DIR);
export const ERROR_LOG = path.join(LOG_DIR, 'error.log');
mkdirSync(LOG_DIR, { recursive: true });

const STACK_LINES = 4;
const trimStack = winston.format((info) => {
  if (info.stack) info.stack = String(info.stack).split('\n').slice(0, STACK_LINES + 1).join('\n');
  return info;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: [
    new winston.transports.File({
      filename: ERROR_LOG,
      level: 'error',
      maxsize: env.LOG_MAX_SIZE_MB * 1024 * 1024,
      maxFiles: env.LOG_MAX_FILES,
      tailable: true,
      format: winston.format.combine(winston.format.errors({ stack: true }), trimStack(), winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.Console({
      silent: env.NODE_ENV === 'test',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack }) => `${timestamp} ${level} ${message}${stack && env.LOG_LEVEL === 'debug' ? `\n${stack}` : ''}`),
      ),
    }),
  ],
});
