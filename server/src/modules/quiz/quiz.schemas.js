import { z } from 'zod';

const playerId = z.string().regex(/^[A-Za-z0-9_-]{8,40}$/, 'Invalid player');
const publicId = z.string().regex(/^[A-Za-z0-9_-]{16}$/, 'Invalid question');

export const statusQuery = z.object({ player: playerId });

// Rounds are requested with POST (protected by the Origin/JSON checks), never GET.
export const roundBody = z.object({ player: playerId }).strict();

export const answerBody = z
  .object({
    roundToken: z.string().min(20).max(2000).regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/),
    questionId: publicId,
    optionId: z.string().max(32).regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict();
