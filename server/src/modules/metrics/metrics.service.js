import crypto from 'node:crypto';
import env from '../../config/env.js';
import { kv } from '../../common/store/kv.js';
import { logger } from '../../common/logger.js';

/*
 * Privacy friendly metrics: daily counters only, no cookies, no stored IPs.
 * A visitor is a one-way hash of (IP + user agent + a salt that changes every day),
 * so the same person can't be followed across days. Known bots are not counted.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const TTL = () => env.METRICS_RETENTION_DAYS * DAY_MS;
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegram|discord|preview|headless|lighthouse|monitor|curl|wget|python|httpclient|axios|node-fetch/i;

export const EVENTS = ['pageviews', 'quiz_rounds', 'quiz_answers', 'quiz_correct', 'signups', 'contact_messages', 'rate_limited', 'bans'];

const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

const visitorId = (ip, ua, day) =>
  crypto.createHmac('sha256', env.IP_HASH_SALT).update(`${day}|${ip}|${ua}`).digest('base64url').slice(0, 22);

/** Fire and forget: metrics must never break a request. */
export function track(event, req) {
  if (req && BOT.test(req.get?.('user-agent') || '')) return;
  kv.incr(`metrics:${dayKey()}:${event}`, TTL()).catch((err) => logger.warn(`metrics: ${err.message}`));
}

export function trackPageView(req, page) {
  const ua = req.get('user-agent') || '';
  if (!ua || BOT.test(ua)) return;
  const day = dayKey();
  Promise.all([
    kv.incr(`metrics:${day}:pageviews`, TTL()),
    kv.addUnique(`metrics:${day}:visitors`, visitorId(req.ip, ua, day), TTL()),
    kv.hincr(`metrics:${day}:pages`, page, TTL()),
  ]).catch((err) => logger.warn(`metrics: ${err.message}`));
}

/** Daily series for the last `days` days (oldest first) plus today's top pages. */
export async function getSummary(days = 30) {
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = dayKey(Date.now() - i * DAY_MS);
    const [visitors, ...counts] = await Promise.all([
      kv.countUnique(`metrics:${day}:visitors`),
      ...EVENTS.map((e) => kv.get(`metrics:${day}:${e}`)),
    ]);
    const row = { day, visitors: Number(visitors) || 0 };
    EVENTS.forEach((e, idx) => {
      row[e] = Number(counts[idx]) || 0;
    });
    series.push(row);
  }
  const pages = await kv.hgetall(`metrics:${dayKey()}:pages`);
  const topPages = Object.entries(pages)
    .map(([page, views]) => ({ page, views: Number(views) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  return { series, topPages };
}
