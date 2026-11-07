import { hashIp } from '../../common/utils/hash.js';
import { networkOf } from '../../common/utils/network.js';
import { HttpError } from '../../common/utils/httpError.js';
import { kv, msUntilUtcMidnight } from '../../common/store/kv.js';
import env from '../../config/env.js';

/*
 * Daily quiz allowance per UTC day: QUIZ_ROUNDS_PER_DAY per player, plus a looser
 * per network cap so resetting the browser doesn't give unlimited rounds, while a
 * family or office on one connection can still play. Counters live in Redis when
 * available (shared, survive restarts) and expire at midnight UTC.
 */
export const ROUNDS_PER_DAY = env.QUIZ_ROUNDS_PER_DAY;
const ROUNDS_PER_NETWORK = env.QUIZ_ROUNDS_PER_NETWORK_PER_DAY;
const DAY_MS = 24 * 60 * 60 * 1000;

const day = () => Math.floor(Date.now() / DAY_MS);
const resetAt = () => new Date((day() + 1) * DAY_MS).toISOString();
const playerKey = (player) => `quiz:rounds:${day()}:p:${player}`;
const networkKey = (ip) => `quiz:rounds:${day()}:n:${hashIp(networkOf(ip))}`;

function allowance(playerUsed, networkUsed) {
  return {
    remaining: Math.max(0, Math.min(ROUNDS_PER_DAY - playerUsed, ROUNDS_PER_NETWORK - networkUsed)),
    limit: ROUNDS_PER_DAY,
    questionsPerRound: env.QUIZ_QUESTIONS_PER_ROUND,
    resetAt: resetAt(),
  };
}

export async function getAllowance(player, ip) {
  const [p, n] = await Promise.all([kv.get(playerKey(player)), kv.get(networkKey(ip))]);
  return allowance(Number(p) || 0, Number(n) || 0);
}

/** Uses one round, or throws 429 if today's rounds are used up. */
export async function useRound(player, ip) {
  const ttl = msUntilUtcMidnight() + 60_000;
  const pKey = playerKey(player);
  const nKey = networkKey(ip);
  const [p, n] = await Promise.all([kv.incr(pKey, ttl), kv.incr(nKey, ttl)]);
  if (p > ROUNDS_PER_DAY || n > ROUNDS_PER_NETWORK) {
    // Over the limit: undo this attempt so it doesn't count.
    await Promise.all([kv.decr(pKey), kv.decr(nKey)]);
    const err = new HttpError(429, "You've used all of today's quiz rounds. New rounds unlock at midnight UTC.");
    err.code = 'DAILY_LIMIT';
    err.resetAt = resetAt();
    throw err;
  }
  return allowance(p, n);
}
