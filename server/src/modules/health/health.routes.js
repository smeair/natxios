import { Router } from 'express';
import env from '../../config/env.js';
import { redis } from '../../config/redis.js';
import { count } from '../bank/bank.repository.js';

const router = Router();

/**
 * Public liveness check for uptime monitors and hosts. Deliberately minimal:
 * full details (database, Redis, memory, errors) are in the admin dashboard.
 */
router.get('/', (_req, res) => {
  const redisDown = env.redisRequired && !redis?.isReady;
  const ok = count() > 0 && !redisDown;
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded' });
});

export default router;
