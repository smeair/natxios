import { Router } from 'express';
import { createLimiter } from '../../common/middleware/rateLimiters.js';
import { validate } from '../../common/middleware/validate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { signupBody } from './newsletter.schemas.js';
import env from '../../config/env.js';
import * as controller from './newsletter.controller.js';

const router = Router();
const signupLimiter = createLimiter({
  name: 'newsletter',
  windowMinutes: 60,
  limit: env.RATE_LIMIT_NEWSLETTER_PER_HOUR,
  message: 'Too many sign-up attempts. Please try again in an hour.',
});

router.post('/', signupLimiter, validate(signupBody, 'body', 'Please check the form and try again.'), asyncHandler(controller.signup));

export default router;
