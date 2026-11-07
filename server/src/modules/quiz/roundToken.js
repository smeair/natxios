import crypto from 'node:crypto';
import env from '../../config/env.js';
import { kv, msUntilUtcMidnight } from '../../common/store/kv.js';

/*
 * A signed token issued with each round. Answers are only accepted for the
 * questions in that round, once each, on the day it was issued, so the answer
 * endpoint can't be used to pull answers out of the bank.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const sign = (payload) => crypto.createHmac('sha256', env.QUIZ_SECRET).update(`round:${payload}`).digest('base64url');

export function issueRoundToken(player, questionIds) {
  const payload = Buffer.from(
    JSON.stringify({ p: player, d: Math.floor(Date.now() / DAY_MS), q: questionIds, n: crypto.randomBytes(9).toString('base64url') }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** @returns {{ n: string, q: string[] } | null} */
export function readRoundToken(token) {
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.d !== Math.floor(Date.now() / DAY_MS) || !Array.isArray(data.q)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Records an answer; returns false if this question in this round was already answered. */
export async function markAnswered(nonce, questionId) {
  return kv.setIfAbsent(`quiz:answered:${nonce}:${questionId}`, '1', msUntilUtcMidnight() + 60_000);
}
