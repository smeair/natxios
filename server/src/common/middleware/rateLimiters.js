import { rateLimit } from 'express-rate-limit';
import { slowDown } from 'express-slow-down';
import { RedisStore } from 'rate-limit-redis';
import env from '../../config/env.js';
import { redis } from '../../config/redis.js';
import { track } from '../../modules/metrics/metrics.service.js';

/*
 * Rate limiting is layered: a site wide limit, an API wide limit with progressive
 * slow down, and a tighter limit per module (each module creates its own).
 * With REDIS_URL set, counts are shared across instances and survive restarts.
 */
const MINUTE = 60 * 1000;

const storeFor = (name) =>
  redis
    ? new RedisStore({
        sendCommand: (...args) => redis.sendCommand(args),
        prefix: `${env.REDIS_KEY_PREFIX}rl:${name}:`,
      })
    : undefined; // express-rate-limit's default in-memory store

export function createLimiter({ name, windowMinutes = env.RATE_LIMIT_WINDOW_MINUTES, limit, message = 'Too many requests, please try again later.' }) {
  if (!name) throw new Error('createLimiter needs a unique name');
  return rateLimit({
    windowMs: windowMinutes * MINUTE,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
    store: storeFor(name),
    passOnStoreError: false,
    handler: (req, res, _next, options) => {
      track('rate_limited');
      res.status(options.statusCode).json(options.message);
    },
  });
}

/** Every request to the site (pages, files and API). Generous for people, tight for floods. */
export const siteLimiter = createLimiter({ name: 'site', limit: env.RATE_LIMIT_SITE });

/** All /api routes together. */
export const apiLimiter = createLimiter({ name: 'api', limit: env.RATE_LIMIT_API });

/** After API_SLOWDOWN_AFTER calls in a window, each extra call is delayed a little more. */
export const apiSlowDown = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * MINUTE,
  delayAfter: env.API_SLOWDOWN_AFTER,
  delayMs: (hits) => Math.min((hits - env.API_SLOWDOWN_AFTER) * env.API_SLOWDOWN_STEP_MS, env.API_SLOWDOWN_MAX_MS),
  store: storeFor('slowdown'),
});
