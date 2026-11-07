import { createClient } from 'redis';
import env from './env.js';
import { logger } from '../common/logger.js';

/*
 * Optional Redis connection. With REDIS_URL set, rate limits, quiz counters, bans,
 * single-use tokens and the daily facts cache are shared and survive restarts.
 * Without it, everything falls back to in-process memory (fine for local development).
 */
export const redis = env.REDIS_URL
  ? createClient({
      url: env.REDIS_URL,
      socket: { connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS, reconnectStrategy: (n) => Math.min(n * 200, 5000) },
    })
  : null;

if (redis) {
  redis.on('error', (err) => logger.warn(`Redis error: ${err.message}`));
}

export async function connectRedis() {
  if (!redis) {
    if (env.redisRequired) throw new Error('Redis is required (production default, or REDIS_REQUIRED=true) but REDIS_URL is not set.');
    logger.warn('REDIS_URL not set: using in-memory stores (counts reset on restart).');
    return false;
  }
  await redis.connect();
  await redis.ping();
  logger.info('Redis connected');
  await ensureNoEviction();
  return true;
}

/*
 * Redis must never evict our keys: an evicted ban, lockout, used token or "sign out everywhere"
 * marker would silently undo a security control. Check the policy, fix it if allowed, and refuse
 * to start in production if it can't be made safe.
 */
async function ensureNoEviction() {
  const enforce = env.REDIS_REQUIRE_NOEVICTION ?? env.isProd;
  let policy;
  try {
    const res = await redis.configGet('maxmemory-policy');
    policy = res['maxmemory-policy'];
  } catch {
    // Many managed Redis services (e.g. Upstash) block CONFIG commands.
    logger.warn('Could not read Redis maxmemory-policy (CONFIG is blocked by this provider). Make sure eviction is turned OFF in your Redis provider settings.');
    return;
  }
  if (policy === 'noeviction') {
    logger.info('Redis eviction policy: noeviction');
    return;
  }
  try {
    await redis.configSet('maxmemory-policy', 'noeviction');
    logger.warn(`Redis maxmemory-policy was "${policy}"; changed it to "noeviction". Also set it in redis.conf so it survives Redis restarts.`);
  } catch {
    const msg = `Redis maxmemory-policy is "${policy}" and could not be changed. Set "maxmemory-policy noeviction" in redis.conf or your provider settings.`;
    if (enforce) throw new Error(msg);
    logger.warn(msg);
  }
}

export async function disconnectRedis() {
  if (redis?.isOpen) await redis.quit();
}
