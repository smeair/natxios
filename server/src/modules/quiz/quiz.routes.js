import { Router } from 'express';
import { createLimiter } from '../../common/middleware/rateLimiters.js';
import { validate } from '../../common/middleware/validate.js';
import { statusQuery, roundBody, answerBody } from './quiz.schemas.js';
import env from '../../config/env.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as controller from './quiz.controller.js';

const router = Router();
const statusLimiter = createLimiter({ name: 'quiz-status', limit: env.RATE_LIMIT_QUIZ_STATUS });
const roundLimiter = createLimiter({ name: 'quiz-round', limit: env.RATE_LIMIT_QUIZ_ROUND });
const answerLimiter = createLimiter({ name: 'quiz-answer', limit: env.RATE_LIMIT_QUIZ_ANSWER, message: 'You are answering very fast. Take a short break and try again.' });

router.get('/status', statusLimiter, validate(statusQuery, 'query', 'Invalid request'), asyncHandler(controller.status));
router.post('/round', roundLimiter, validate(roundBody, 'body', 'Invalid quiz request'), asyncHandler(controller.round));
router.post('/answer', answerLimiter, validate(answerBody, 'body', 'Invalid answer'), asyncHandler(controller.answer));

export default router;
