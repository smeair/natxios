import { z } from 'zod';

// Keep these rules in sync with client/src/lib/validation.js.
export const NAME_PATTERN = /^[\p{L}\p{M}' .-]*$/u;

export const signupBody = z
  .object({
    email: z
      .string({ error: 'Please enter your email.' })
      .trim()
      .toLowerCase()
      .min(1, 'Please enter your email.')
      .max(254, 'That email is too long.')
      .pipe(z.email({ error: 'Please enter a valid email address.' })),
    name: z
      .string()
      .trim()
      .max(60, 'Name must be 60 characters or fewer.')
      .regex(NAME_PATTERN, 'Please use letters only in your name.')
      .optional()
      .default(''),
    consent: z.literal(true, { error: 'Please tick the box to confirm.' }),
    formToken: z.string().max(200),
    // Honeypot: real people never see or fill this field.
    website: z.string().max(200).optional().default(''),
  })
  .strict();
