import env from '../../config/env.js';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defence for a cookie-less JSON API:
 *  1. Browsers always send Origin on cross-site POSTs; reject unknown origins.
 *  2. Require application/json, since HTML forms cannot send it without a CORS preflight.
 */
export function requireTrustedOrigin(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  const fetchSite = req.get('sec-fetch-site');

  if (origin && !env.ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!origin && fetchSite && fetchSite !== 'same-origin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Unsupported content type' });
  }
  return next();
}

const FORBIDDEN_KEY = /^\$|\./;
const MAX_DEPTH = 5;

function isDirty(value, depth = 0) {
  if (depth > MAX_DEPTH) return true;
  if (Array.isArray(value)) return value.some((v) => isDirty(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.keys(value).some(
      (k) => FORBIDDEN_KEY.test(k) || k === '__proto__' || k === 'constructor' || k === 'prototype' || isDirty(value[k], depth + 1),
    );
  }
  return false;
}

/** Reject payloads carrying Mongo operators, dotted paths, prototype keys or excessive nesting. */
export function rejectNoSqlInjection(req, res, next) {
  if (isDirty(req.body) || isDirty(req.params)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  return next();
}
