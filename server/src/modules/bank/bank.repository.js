import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import env from '../../config/env.js';
import { decryptBank } from './bankCrypto.js';

/*
 * Natxios's own question and fact bank. Stored encrypted as questions.enc (committed);
 * questions.json is the plain copy for editing (gitignored, development only).
 * Powers the quiz, fact of the day and the ticker. Validated at startup so a bad
 * edit fails loudly instead of breaking the site. Swap this file for a MongoDB
 * repository later; the services only use the functions exported here.
 */
const itemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{3,60}$/),
    topic: z.string().min(2).max(30),
    question: z.string().min(8).max(220),
    answer: z.string().min(1).max(80),
    wrong: z.array(z.string().min(1).max(80)).length(3),
    detail: z.string().min(10).max(320),
    short: z.string().min(8).max(110),
    source: z.string().max(200).optional().default(''),
  })
  .strict()
  .refine((q) => new Set([q.answer, ...q.wrong].map((s) => s.toLowerCase())).size === 4, {
    message: 'answer and wrong options must all be different',
  });

const ENC = new URL('./questions.enc', import.meta.url);
const PLAIN = new URL('./questions.json', import.meta.url);

function loadRaw() {
  // Production always reads the encrypted file. Development prefers it when a key is set.
  if (env.BANK_ENCRYPTION_KEY && existsSync(ENC)) {
    return JSON.parse(decryptBank(readFileSync(ENC, 'utf8').trim(), env.BANK_ENCRYPTION_KEY));
  }
  if (env.isProd) throw new Error('questions.enc and BANK_ENCRYPTION_KEY are required in production.');
  if (existsSync(PLAIN)) return JSON.parse(readFileSync(PLAIN, 'utf8'));
  throw new Error('No question bank found. Add questions.enc + BANK_ENCRYPTION_KEY, or questions.json for development.');
}

// Loaded and validated once at startup, then served from memory.
const raw = loadRaw();
const parsed = z.array(itemSchema).safeParse(raw);
if (!parsed.success) {
  const issue = parsed.error.issues[0];
  throw new Error(`questions.json is invalid at ${issue.path.join('.')}: ${issue.message}`);
}

const ITEMS = Object.freeze(parsed.data);
const BY_ID = new Map(ITEMS.map((q) => [q.id, q]));
if (BY_ID.size !== ITEMS.length) throw new Error('questions.json has duplicate ids');

export const allItems = () => ITEMS;
export const findById = (id) => BY_ID.get(id);
export const count = () => ITEMS.length;
