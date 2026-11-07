import { Router } from 'express';
import env from '../../config/env.js';
import { createLimiter } from '../../common/middleware/rateLimiters.js';
import { validate } from '../../common/middleware/validate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { contactBody } from './contact.schemas.js';
import * as controller from './contact.controller.js';

const router = Router();
const contactLimiter = createLimiter({
  name: 'contact',
  windowMinutes: 60,
  limit: env.RATE_LIMIT_CONTACT_PER_HOUR,
  message: 'You have sent a few messages already. Please try again in an hour.',
});

router.post('/', contactLimiter, validate(contactBody, 'body', 'Please check the form and try again.'), asyncHandler(controller.submit));

export default router;
