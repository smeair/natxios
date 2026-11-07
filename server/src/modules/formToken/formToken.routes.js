import { Router } from 'express';
import { createLimiter } from '../../common/middleware/rateLimiters.js';
import env from '../../config/env.js';
import * as controller from './formToken.controller.js';

const router = Router();
const tokenLimiter = createLimiter({ name: 'form-token', limit: env.RATE_LIMIT_FORM_TOKEN });

router.get('/', tokenLimiter, controller.issue);

export default router;
