import { orderFor } from '../bank/ordering.js';
import env from '../../config/env.js';
import { kv, msUntilUtcMidnight } from '../../common/store/kv.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TICKER_LINES = 12;

/*
 * Fact of the day and the ticker are fixed for each UTC day, worked out once and
 * cached in process memory and in Redis (shared by every instance). Repeated requests return the same content, so the endpoint
 * can't be used to pull the bank out a few facts at a time.
 */
let cache = { day: -1, payload: null };

export async function getToday(now = Date.now()) {
  const day = Math.floor(now / DAY_MS);
  if (cache.day === day) return cache.payload;

  // Shared cache across instances (Redis), expiring at midnight UTC.
  const cached = await kv.get(`facts:today:${day}`);
  if (cached) {
    cache = { day, payload: Object.freeze(JSON.parse(cached)) };
    return cache.payload;
  }

  const order = orderFor(env.FACT_ROTATION_SEED);
  const fact = order[day % order.length];
  const ticker = orderFor(`${env.FACT_ROTATION_SEED}:ticker:${day}`)
    .filter((q) => q.id !== fact.id)
    .slice(0, TICKER_LINES)
    .map((q) => q.short);

  const payload = Object.freeze({
    date: new Date(day * DAY_MS).toISOString().slice(0, 10),
    nextAt: new Date((day + 1) * DAY_MS).toISOString(),
    fact: { topic: fact.topic, title: fact.short, detail: fact.detail },
    ticker,
  });
  cache = { day, payload };
  await kv.set(`facts:today:${day}`, JSON.stringify(payload), msUntilUtcMidnight(now) + 60_000);
  return payload;
}
