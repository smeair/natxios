import crypto from 'node:crypto';
import env from '../../config/env.js';

/** One-way hash so we can spot abuse patterns without storing raw IPs. */
export function hashIp(ip = '') {
  return crypto.createHmac('sha256', env.IP_HASH_SALT).update(ip).digest('hex');
}
