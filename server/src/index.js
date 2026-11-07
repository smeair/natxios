import http from 'node:http';
import env from './config/env.js';
import { connectDB, disconnectDB, ensureIndexes } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { verifyMailer } from './config/mailer.js';
import { logger } from './common/logger.js';

async function main() {
  await connectRedis();
  await connectDB();
  verifyMailer(); // non-blocking: logs whether email sending works
  // Load the app only after Redis is connected, so rate limit stores attach to a live client.
  const { createApp } = await import('./app.js');
  const app = createApp();
  await ensureIndexes(); // models are registered once the app is loaded

  // Small header limit blocks oversized-header attacks; our requests are tiny.
  const server = http.createServer({ maxHeaderSize: env.MAX_HEADER_SIZE_BYTES }, app);
  server.listen(env.PORT, () => {
    logger.info(`Natxios server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Slow-loris style protection.
  server.headersTimeout = env.HEADERS_TIMEOUT_MS;
  server.requestTimeout = env.REQUEST_TIMEOUT_MS;
  server.keepAliveTimeout = env.KEEP_ALIVE_TIMEOUT_MS;
  server.maxRequestsPerSocket = env.MAX_REQUESTS_PER_SOCKET;

  const shutdown = (signal) => {
    logger.info(`\n${signal} received, shutting down…`);
    server.close(async () => {
      await Promise.allSettled([disconnectDB(), disconnectRedis()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), env.SHUTDOWN_TIMEOUT_MS).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason?.message || reason}`, { stack: reason?.stack });
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

main().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
