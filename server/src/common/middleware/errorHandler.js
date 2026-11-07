import env from '../../config/env.js';
import { logger } from '../logger.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Malformed / oversized JSON from express.json()
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;

  // Only real server errors are logged (minimal: what failed and where).
  if (status >= 500) {
    logger.error(err.message || 'Unknown error', {
      stack: err.stack,
      method: req.method,
      path: req.path,
      status,
    });
  }

  return res.status(status).json({
    error: status >= 500 ? 'Something went wrong' : err.expose ? err.message : 'Bad request',
    ...(err.expose && err.code ? { code: err.code } : {}),
    ...(err.expose && err.resetAt ? { resetAt: err.resetAt } : {}),
    ...(env.isProd || status >= 500 ? {} : { detail: err.message }),
  });
}
