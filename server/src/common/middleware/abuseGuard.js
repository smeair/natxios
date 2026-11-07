import env from '../../config/env.js';
import { kv } from '../store/kv.js';
import { hashIp } from '../utils/hash.js';
import { track } from '../../modules/metrics/metrics.service.js';
import { logger } from '../../common/logger.js';

/*
 * Bans IPs that probe for common attack paths (.env, .git, wp-admin, .php, ...).
 * Real visitors never request these, so a few hits in a short window earns a temporary ban.
 * Stored in Redis when available, so bans are shared and survive restarts.
 */
const PROBE = /(\/\.(env|git|svn|hg|aws|ssh|DS_Store|htaccess|htpasswd)|wp-(admin|login|content|includes)|xmlrpc|phpmyadmin|\.(php|asp|aspx|jsp|cgi|sql|bak|old|ini|log)(\?|$)|\/(cgi-bin|vendor\/phpunit|actuator|server-status|config\.json))/i;

const WINDOW_MS = env.ABUSE_WINDOW_MINUTES * 60 * 1000;
const BAN_MS = env.ABUSE_BAN_MINUTES * 60 * 1000;
const banKey = (ip) => `abuse:ban:${hashIp(ip)}`;
const probeKey = (ip) => `abuse:probe:${hashIp(ip)}`;

export async function blockBanned(req, res, next) {
  try {
    if (await kv.get(banKey(req.ip))) {
      res.set('Retry-After', String(env.ABUSE_BAN_MINUTES * 60));
      return res.status(403).type('text/plain').send('Forbidden');
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

export async function detectProbes(req, res, next) {
  if (!PROBE.test(req.path)) return next();
  // A browser loading a probe path because another website told it to (images, scripts, iframes)
  // sends Sec-Fetch-Site: cross-site. Don't let that get innocent visitors banned.
  const site = req.get('sec-fetch-site');
  if (site && site !== 'none' && site !== 'same-origin') {
    return res.status(404).type('text/plain').send('Not found');
  }
  try {
    const hits = await kv.incr(probeKey(req.ip), WINDOW_MS);
    if (hits >= env.ABUSE_MAX_PROBES) {
      await kv.set(banKey(req.ip), '1', BAN_MS);
      track('bans');
      logger.warn(`Banned an IP for ${env.ABUSE_BAN_MINUTES} min after probing ${req.path}`);
    }
    return res.status(404).type('text/plain').send('Not found');
  } catch (err) {
    return next(err);
  }
}
