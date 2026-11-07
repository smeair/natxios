import { open, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import env from '../../config/env.js';
import { isDBReady } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { count as bankCount } from '../bank/bank.repository.js';
import Subscriber from '../newsletter/subscriber.model.js';
import { getSummary } from '../metrics/metrics.service.js';
import { ERROR_LOG } from '../../common/logger.js';

const PAGE_SIZE = 50;
const TAIL_BYTES = 512 * 1024;
const VERSION = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Most recent error log entries, newest first. Reads only the end of the file. */
export async function readErrors(limit) {
  if (!existsSync(ERROR_LOG)) return [];
  const { size } = await stat(ERROR_LOG);
  const start = Math.max(0, size - TAIL_BYTES);
  const fh = await open(ERROR_LOG, 'r');
  try {
    const buf = Buffer.alloc(size - start);
    await fh.read(buf, 0, buf.length, start);
    const lines = buf.toString('utf8').split('\n').filter(Boolean);
    if (start > 0) lines.shift(); // first line may be cut in half
    return lines
      .map((l) => {
        try {
          const e = JSON.parse(l);
          return { time: e.timestamp, message: e.message, method: e.method, path: e.path, status: e.status, stack: e.stack };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse()
      .slice(0, limit);
  } finally {
    await fh.close();
  }
}

export async function health() {
  const errors = await readErrors(500);
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const mem = process.memoryUsage();
  return {
    status: 'ok',
    version: VERSION,
    environment: env.NODE_ENV,
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: { rss: Math.round(mem.rss / 1048576), heapUsed: Math.round(mem.heapUsed / 1048576) },
    checks: {
      database: env.MONGODB_URI ? (isDBReady() ? 'connected' : 'down') : 'not configured',
      redis: redis ? (redis.isReady ? 'connected' : 'down') : 'not configured',
      questionBank: bankCount(),
    },
    errorsLast24h: errors.filter((e) => new Date(e.time).getTime() > dayAgo).length,
  };
}

export async function subscriberStats() {
  if (!isDBReady()) return { available: false, total: 0 };
  const [total, subscribed, pending] = await Promise.all([
    Subscriber.countDocuments({}),
    Subscriber.countDocuments({ status: 'subscribed' }),
    Subscriber.countDocuments({ status: 'pending' }),
  ]);
  return { available: true, total, subscribed, pending };
}

export async function overview(days) {
  const [metrics, subscribers, h] = await Promise.all([getSummary(days), subscriberStats(), health()]);
  return { metrics, subscribers, health: h };
}

function subscriberFilter({ search, status }) {
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ email: re }, { name: re }];
  }
  return filter;
}

export async function listSubscribers(query) {
  if (!isDBReady()) return { available: false, items: [], total: 0, page: 1, pages: 1 };
  const filter = subscriberFilter(query);
  const total = await Subscriber.countDocuments(filter);
  const items = await Subscriber.find(filter, { email: 1, name: 1, status: 1, consentAt: 1, createdAt: 1, _id: 0 })
    .sort({ createdAt: -1 })
    .skip((query.page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();
  return { available: true, items, total, page: query.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

// Stop spreadsheet apps treating a cell as a formula (CSV injection).
const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function subscribersCsv(query) {
  if (!isDBReady()) return null;
  const rows = await Subscriber.find(subscriberFilter(query), { email: 1, name: 1, status: 1, consentAt: 1, createdAt: 1, _id: 0 })
    .sort({ createdAt: -1 })
    .lean();
  const header = ['email', 'name', 'status', 'consent_at', 'joined_at'];
  const lines = rows.map((r) =>
    [r.email, r.name, r.status, r.consentAt?.toISOString?.(), r.createdAt?.toISOString?.()].map(csvCell).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}
