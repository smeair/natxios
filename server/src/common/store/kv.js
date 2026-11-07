import { redis } from '../../config/redis.js';
import env from '../../config/env.js';

/*
 * Tiny key/value store used for counters, flags and caches.
 * Uses Redis when REDIS_URL is set, otherwise in-process memory with expiry.
 * All keys are namespaced with REDIS_KEY_PREFIX.
 */
const prefix = (key) => `${env.REDIS_KEY_PREFIX}${key}`;

// ---------- memory fallback ----------
const mem = new Map(); // key -> { value, expiresAt }
const MEMORY_SET_CAP = 100_000;
const alive = (e) => e && (!e.expiresAt || e.expiresAt > Date.now());
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of mem) if (e.expiresAt && e.expiresAt <= now) mem.delete(k);
}, 60_000).unref();

const memory = {
  async get(key) {
    const e = mem.get(key);
    return alive(e) ? e.value : null;
  },
  async set(key, value, ttlMs) {
    mem.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
  },
  async setIfAbsent(key, value, ttlMs) {
    if (alive(mem.get(key))) return false;
    mem.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
    return true;
  },
  async incr(key, ttlMs) {
    const e = mem.get(key);
    if (alive(e)) {
      e.value = Number(e.value) + 1;
      return e.value;
    }
    mem.set(key, { value: 1, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
    return 1;
  },
  async decr(key) {
    const e = mem.get(key);
    if (alive(e)) e.value = Math.max(0, Number(e.value) - 1);
  },
  async addUnique(key, member, ttlMs) {
    let e = mem.get(key);
    if (!alive(e)) {
      e = { value: new Set(), expiresAt: ttlMs ? Date.now() + ttlMs : 0 };
      mem.set(key, e);
    }
    if (e.value.size < MEMORY_SET_CAP) e.value.add(member); // bounded: no unbounded memory growth
  },
  async countUnique(key) {
    const e = mem.get(key);
    return alive(e) ? e.value.size : 0;
  },
  async hincr(key, field, ttlMs) {
    let e = mem.get(key);
    if (!alive(e)) {
      e = { value: new Map(), expiresAt: ttlMs ? Date.now() + ttlMs : 0 };
      mem.set(key, e);
    }
    e.value.set(field, (e.value.get(field) || 0) + 1);
  },
  async hgetall(key) {
    const e = mem.get(key);
    return alive(e) ? Object.fromEntries(e.value) : {};
  },
  async del(key) {
    mem.delete(key);
  },
};

// ---------- redis ----------
const remote = {
  async get(key) {
    return redis.get(key);
  },
  async set(key, value, ttlMs) {
    await redis.set(key, String(value), ttlMs ? { PX: ttlMs } : undefined);
  },
  async setIfAbsent(key, value, ttlMs) {
    const res = await redis.set(key, String(value), { NX: true, ...(ttlMs ? { PX: ttlMs } : {}) });
    return res === 'OK';
  },
  async incr(key, ttlMs) {
    // Increment and set the expiry in one atomic step (no counter left without a TTL).
    if (!ttlMs) return redis.incr(key);
    const [n] = await redis.multi().incr(key).pExpire(key, ttlMs, 'NX').exec();
    return Number(n);
  },
  async decr(key) {
    await redis.decr(key);
  },
  async addUnique(key, member, ttlMs) {
    // HyperLogLog: counts unique members in a tiny fixed amount of memory.
    await redis.pfAdd(key, member);
    if (ttlMs) await redis.pExpire(key, ttlMs, 'NX');
  },
  async countUnique(key) {
    return redis.pfCount(key);
  },
  async hincr(key, field, ttlMs) {
    await redis.hIncrBy(key, field, 1);
    if (ttlMs) await redis.pExpire(key, ttlMs, 'NX');
  },
  async hgetall(key) {
    const h = await redis.hGetAll(key);
    return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v)]));
  },
  async del(key) {
    await redis.del(key);
  },
};

const backend = () => (redis?.isReady ? remote : memory);

export const kv = {
  get: (key) => backend().get(prefix(key)),
  set: (key, value, ttlMs) => backend().set(prefix(key), value, ttlMs),
  /** Sets only if the key doesn't exist. Returns true if it was set. */
  setIfAbsent: (key, value, ttlMs) => backend().setIfAbsent(prefix(key), value, ttlMs),
  /** Increments a counter; the TTL starts when the counter is created. Returns the new value. */
  incr: (key, ttlMs) => backend().incr(prefix(key), ttlMs),
  decr: (key) => backend().decr(prefix(key)),
  /** Adds a member to an approximate unique-count set (HyperLogLog in Redis). */
  addUnique: (key, member, ttlMs) => backend().addUnique(prefix(key), member, ttlMs),
  countUnique: (key) => backend().countUnique(prefix(key)),
  /** Increments one field of a counter hash. */
  hincr: (key, field, ttlMs) => backend().hincr(prefix(key), field, ttlMs),
  hgetall: (key) => backend().hgetall(prefix(key)),
  del: (key) => backend().del(prefix(key)),
};

/** Milliseconds until the next UTC midnight. */
export const msUntilUtcMidnight = (now = Date.now()) => {
  const day = 24 * 60 * 60 * 1000;
  return (Math.floor(now / day) + 1) * day - now;
};
