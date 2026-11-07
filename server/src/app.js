import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import env from './config/env.js';
import { logger } from './common/logger.js';
import { helmetMiddleware, permissionsPolicy } from './common/middleware/security.js';
import { siteLimiter } from './common/middleware/rateLimiters.js';
import { blockBanned, detectProbes } from './common/middleware/abuseGuard.js';
import { notFound, errorHandler } from './common/middleware/errorHandler.js';
import { createApiRouter } from './routes.js';
import { createFrontendRouter } from './web/frontend.js';

const ALLOWED_METHODS = ['GET', 'HEAD', 'POST', 'OPTIONS'];

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('query parser', 'simple'); // no nested objects from ?a[b]=c

  // Spot a likely misconfiguration: proxy headers arriving while TRUST_PROXY is 0.
  let warnedProxy = false;
  app.use((req, _res, next) => {
    if (!warnedProxy && env.TRUST_PROXY === 0 && req.headers['x-forwarded-for']) {
      warnedProxy = true;
      logger.warn('X-Forwarded-For received but TRUST_PROXY=0. If the app runs behind a proxy, set TRUST_PROXY or all visitors will share one IP.');
    }
    next();
  });

  // Protection that applies to every request, in this order.
  app.use(helmetMiddleware);
  app.use(permissionsPolicy);
  app.use(blockBanned);
  app.use(detectProbes);
  app.use(siteLimiter);
  app.use((req, res, next) => {
    if (ALLOWED_METHODS.includes(req.method)) return next();
    res.set('Allow', ALLOWED_METHODS.join(', '));
    return res.status(405).json({ error: 'Method not allowed' });
  });

  app.use(compression());
  app.use(morgan(env.LOG_FORMAT || (env.isProd ? 'combined' : 'dev')));

  app.use('/api', createApiRouter());
  app.use(createFrontendRouter());

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
