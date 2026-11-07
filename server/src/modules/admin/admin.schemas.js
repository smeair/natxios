import { z } from 'zod';

export const loginBody = z
  .object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email({ error: 'Enter a valid email.' })),
    password: z.string().min(1, 'Enter your password.').max(200),
    code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6 digit code.').optional(),
  })
  .strict();

export const subscribersQuery = z.object({
  search: z.string().trim().max(100).optional().default(''),
  status: z.enum(['all', 'pending', 'subscribed', 'unsubscribed']).default('all'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export const messagesQuery = z.object({
  search: z.string().trim().max(100).optional().default(''),
  status: z.enum(['all', 'new', 'read']).default('all'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export const idParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id') });

export const errorsQuery = z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) });
export const metricsQuery = z.object({ days: z.coerce.number().int().min(7).max(90).default(30) });
