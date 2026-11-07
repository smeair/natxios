import env from '../../config/env.js';
import { adminEnabled, getSession, readCookie } from './admin.auth.js';

/** 404 when admin isn't configured or the IP isn't allowed, so the admin API doesn't even appear to exist. */
export function adminAvailable(req, res, next) {
  if (!adminEnabled()) return res.status(404).json({ error: 'Not found' });
  if (env.ADMIN_IP_ALLOWLIST.length && !env.ADMIN_IP_ALLOWLIST.includes(req.ip)) {
    return res.status(404).json({ error: 'Not found' });
  }
  return next();
}

export async function requireAdmin(req, res, next) {
  try {
    const token = readCookie(req, env.ADMIN_COOKIE_NAME);
    const session = await getSession(token);
    if (!session) return res.status(401).json({ error: 'Please sign in.' });
    req.adminToken = token;
    return next();
  } catch (err) {
    return next(err);
  }
}
