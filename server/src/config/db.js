import mongoose from 'mongoose';
import env from './env.js';
import { logger } from '../common/logger.js';

// Strip query selectors ($gt, $ne, ...) from filters built from user input.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);
// Fail fast instead of queueing queries for 10s when there is no connection.
mongoose.set('bufferCommands', false);

export const isDBReady = () => mongoose.connection.readyState === 1;

/** Connects if MONGODB_URI is set. Returns true when connected. */
export async function connectDB() {
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set: running without a database (newsletter disabled).');
    return false;
  }
  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: !env.isProd,
      serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
    });
    logger.info('MongoDB connected');
    return true;
  } catch (err) {
    // A configured-but-unreachable DB is fatal in production; tolerated in development.
    if (env.isProd) throw err;
    logger.warn(`Could not connect to MongoDB (${err.message}). Continuing without a database.`);
    return false;
  }
}

/** Builds model indexes (unique emails, contact message TTL). Safe to run on every start. */
export async function ensureIndexes() {
  if (!isDBReady()) return;
  for (const name of mongoose.modelNames()) {
    try {
      await mongoose.model(name).createIndexes();
    } catch (err) {
      logger.error(`Index build failed for ${name}: ${err.message}`);
    }
  }
  logger.info('MongoDB indexes ready');
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
}
