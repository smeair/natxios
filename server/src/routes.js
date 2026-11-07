import express from 'express';
import env from './config/env.js';
import { corsMiddleware } from './common/middleware/security.js';
import { requireTrustedOrigin, rejectNoSqlInjection } from './common/middleware/requestGuards.js';
import { apiLimiter, apiSlowDown } from './common/middleware/rateLimiters.js';
import { notFound } from './common/middleware/errorHandler.js';
import healthRoutes from './modules/health/health.routes.js';
import formTokenRoutes from './modules/formToken/formToken.routes.js';
import newsletterRoutes from './modules/newsletter/newsletter.routes.js';
import factsRoutes from './modules/facts/facts.routes.js';
import quizRoutes from './modules/quiz/quiz.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import contactRoutes from './modules/contact/contact.routes.js';

/** Everything under /api. Shared protection first, then each module mounts its own routes. */
export function createApiRouter() {
  const api = express.Router();

  api.use(corsMiddleware);
  api.use(apiSlowDown);
  api.use(apiLimiter);
  api.use(requireTrustedOrigin);
  api.use(express.json({ limit: env.JSON_BODY_LIMIT, strict: true }));
  api.use(rejectNoSqlInjection);
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    // Facts and quiz content must never be indexed or cached by search engines.
    res.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    next();
  });

  api.use('/health', healthRoutes);
  api.use('/form-token', formTokenRoutes);
  api.use('/newsletter', newsletterRoutes);
  api.use('/facts', factsRoutes);
  api.use('/quiz', quizRoutes);
  api.use('/contact', contactRoutes);
  api.use('/admin', adminRoutes);

  api.use(notFound);
  return api;
}
