import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    logger.warn('MONGO_URI is empty. Database connection skipped.');
    return;
  }

  await mongoose.connect(env.mongoUri);
  logger.info('MongoDB connected');
}
