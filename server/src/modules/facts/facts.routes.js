import { Router } from 'express';
import { createLimiter } from '../../common/middleware/rateLimiters.js';
import env from '../../config/env.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as controller from './facts.controller.js';

const router = Router();
const factsLimiter = createLimiter({ name: 'facts', limit: env.RATE_LIMIT_FACTS });

router.get('/today', factsLimiter, asyncHandler(controller.today));

export default router;
