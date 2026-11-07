import crypto from 'node:crypto';
import env from '../../config/env.js';
import { kv } from '../../common/store/kv.js';

/*
 * Stateless, signed, single-use form tokens.
 *  - Bots that post directly without loading the page have no token.
 *  - Bots that submit instantly fail the minimum fill time.
 *  - Replays fail the used-nonce check (stored in Redis when available).
 */
const MIN_AGE_MS = env.FORM_TOKEN_MIN_AGE_SECONDS * 1000;
const MAX_AGE_MS = env.FORM_TOKEN_MAX_AGE_MINUTES * 60 * 1000;

function sign(payload) {
  return crypto.createHmac('sha256', env.FORM_TOKEN_SECRET).update(payload).digest('base64url');
}

export function issueFormToken() {
  const payload = `${Date.now()}.${crypto.randomBytes(16).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

/** @returns {{ ok: true } | { ok: false, reason: string }} */
export async function verifyFormToken(token) {
  if (typeof token !== 'string' || token.length > 200) return { ok: false, reason: 'missing' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  const [issuedAt, nonce, signature] = parts;
  const expected = Buffer.from(sign(`${issuedAt}.${nonce}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad-signature' };
  }

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < MIN_AGE_MS) return { ok: false, reason: 'too-fast' };
  if (age > MAX_AGE_MS) return { ok: false, reason: 'expired' };

  // Single use: the first submission claims the nonce (shared via Redis when available).
  const fresh = await kv.setIfAbsent(`formtoken:${nonce}`, '1', MAX_AGE_MS);
  if (!fresh) return { ok: false, reason: 'replayed' };

  return { ok: true };
}
