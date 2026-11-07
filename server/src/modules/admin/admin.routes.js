import { Router } from 'express';
import env from '../../config/env.js';
import { createLimiter } from '../../common/middleware/rateLimiters.js';
import { validate } from '../../common/middleware/validate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { adminAvailable, requireAdmin } from './admin.middleware.js';
import { loginBody, subscribersQuery, errorsQuery, metricsQuery, messagesQuery, idParam } from './admin.schemas.js';
import * as c from './admin.controller.js';

const router = Router();
const loginLimiter = createLimiter({ name: 'admin-login', limit: env.RATE_LIMIT_ADMIN_LOGIN, message: 'Too many sign in attempts. Please wait and try again.' });

router.use(adminAvailable);
router.get('/auth-config', c.authConfig);
router.post('/login', loginLimiter, validate(loginBody, 'body', 'Please check your details.'), asyncHandler(c.login));

// Everything below needs a valid admin session.
router.use(requireAdmin);
router.post('/logout', asyncHandler(c.logout));
router.post('/logout-everywhere', asyncHandler(c.logoutEverywhere));
router.get('/sign-ins', asyncHandler(c.signIns));
router.get('/me', c.me);
router.get('/overview', validate(metricsQuery, 'query'), asyncHandler(c.overview));
router.get('/health', asyncHandler(c.health));
router.get('/subscribers', validate(subscribersQuery, 'query'), asyncHandler(c.subscribers));
router.get('/subscribers.csv', validate(subscribersQuery, 'query'), asyncHandler(c.subscribersCsv));
router.get('/messages', validate(messagesQuery, 'query'), asyncHandler(c.messages));
router.post('/messages/:id/read', validate(idParam, 'params'), asyncHandler(c.messageRead));
router.post('/messages/:id/delete', validate(idParam, 'params'), asyncHandler(c.messageDelete));
router.get('/errors', validate(errorsQuery, 'query'), asyncHandler(c.errors));

export default router;
