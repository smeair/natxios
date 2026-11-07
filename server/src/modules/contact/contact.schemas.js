import { z } from 'zod';

// Keep these rules in sync with client/src/lib/validation.js.
export const NAME_PATTERN = /^[\p{L}\p{M}' .-]+$/u;
export const SUBJECTS = ['General question', 'Fact correction', 'Partnership or collaboration', 'Press', 'Something else'];

// No control characters (blocks email header injection and hidden payloads); allow normal line breaks in the message.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u2028\\u2029]');
const noControl = (s) => !CONTROL_CHARS.test(s);
const singleLine = (s) => !/[\r\n]/.test(s) && noControl(s);

export const contactBody = z
  .object({
    name: z
      .string({ error: 'Please enter your name.' })
      .trim()
      .min(2, 'Please enter your name.')
      .max(80, 'Name must be 80 characters or fewer.')
      .refine(singleLine, 'Name contains invalid characters.')
      .refine((s) => NAME_PATTERN.test(s), 'Please use letters only in your name.'),
    email: z
      .string({ error: 'Please enter your email.' })
      .trim()
      .toLowerCase()
      .max(254, 'That email is too long.')
      .refine(singleLine, 'Please enter a valid email address.')
      .pipe(z.email({ error: 'Please enter a valid email address.' })),
    subject: z.enum(SUBJECTS, { error: 'Please choose a subject.' }),
    message: z
      .string({ error: 'Please write a message.' })
      .trim()
      .min(20, 'Please write at least 20 characters.')
      .max(4000, 'Message must be 4,000 characters or fewer.')
      .refine(noControl, 'Message contains invalid characters.'),
    formToken: z.string().max(200),
    // Honeypot: real people never see or fill this field.
    website: z.string().max(200).optional().default(''),
  })
  .strict();
