import crypto from 'node:crypto';
import env from '../../config/env.js';
import { kv } from '../../common/store/kv.js';
import { verifyPassword } from './password.js';
import { verifyTotp } from './totp.js';
import { networkOf } from '../../common/utils/network.js';

/*
 * Admin authentication: one admin from env.
 *  - Password: scrypt hash (ADMIN_PASSWORD_HASH), or a plain ADMIN_PASSWORD in development only.
 *  - Two-factor: TOTP code when ADMIN_TOTP_SECRET is set (required in production); codes are single use.
 *  - Sessions: random tokens, stored only as SHA-256 hashes, with idle and absolute expiry,
 *    and a "generation" number so every session can be revoked at once.
 */
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const shaHex = (v) => sha(v).toString('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const adminEnabled = () => Boolean(env.ADMIN_EMAIL && (env.ADMIN_PASSWORD_HASH || env.ADMIN_PASSWORD));
export const totpEnabled = () => Boolean(env.ADMIN_TOTP_SECRET);

// A fixed dummy hash so a wrong email takes as long as a wrong password.
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$' + 'A'.repeat(86);

/** Returns true only if email, password and (when enabled) the 2FA code are all correct. */
export async function checkCredentials(email, password, code) {
  if (!adminEnabled()) return false;
  const emailOk = crypto.timingSafeEqual(sha(String(email).trim().toLowerCase()), sha(env.ADMIN_EMAIL.toLowerCase()));

  let passOk;
  if (env.ADMIN_PASSWORD_HASH) {
    passOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH).catch(() => false);
  } else {
    await verifyPassword(password, DUMMY_HASH).catch(() => false); // keep timing similar
    passOk = crypto.timingSafeEqual(sha(password), sha(env.ADMIN_PASSWORD));
  }

  let codeOk = true;
  if (totpEnabled()) {
    const step = verifyTotp(env.ADMIN_TOTP_SECRET, String(code || ''));
    // Single use: each code (time step) can only be accepted once.
    codeOk = step !== null && (await kv.setIfAbsent(`admin:totp:used:${step}`, '1', 3 * 60 * 1000));
  }

  const ok = emailOk && passOk && codeOk;
  if (!ok) await sleep(env.ADMIN_FAILED_LOGIN_DELAY_MS + crypto.randomInt(250));
  return ok;
}

// ---------- lockout ----------
// Lockout is per email AND network, so an attacker elsewhere can't lock the real admin out.
// Attempts are counted atomically BEFORE checking credentials, so bursts can't slip past.
const attemptKey = (email, ip) => `admin:attempts:${shaHex(`${String(email).trim().toLowerCase()}|${networkOf(ip)}`)}`;
const LOCK_MS = () => env.ADMIN_LOCKOUT_MINUTES * 60 * 1000;
/** Counts this attempt; returns true if this email+network is over the limit. */
export async function registerAttempt(email, ip) {
  return (await kv.incr(attemptKey(email, ip), LOCK_MS())) > env.ADMIN_LOCKOUT_AFTER_FAILS;
}
export const clearAttempts = (email, ip) => kv.del(attemptKey(email, ip));

// ---------- sign-in history (last 50, kept 30 days) ----------
const HISTORY_KEY = 'admin:signins';
export async function recordSignIn({ ok, ip, userAgent, reason }) {
  const list = JSON.parse((await kv.get(HISTORY_KEY)) || '[]');
  list.unshift({
    time: new Date().toISOString(),
    ok,
    reason: reason || null,
    network: shaHex(`${env.IP_HASH_SALT}|${ip}`).slice(0, 10), // anonymised, but stable enough to spot repeats
    device: String(userAgent || '').slice(0, 120),
  });
  await kv.set(HISTORY_KEY, JSON.stringify(list.slice(0, 50)), 30 * 24 * 60 * 60 * 1000);
}
export async function signInHistory() {
  return JSON.parse((await kv.get(HISTORY_KEY)) || '[]');
}

// ---------- sessions ----------
const sessionKey = (token) => `admin:session:${shaHex(token)}`;
const GEN_KEY = 'admin:session-generation';
const ABSOLUTE_MS = () => env.ADMIN_SESSION_TTL_MINUTES * 60 * 1000;
const IDLE_MS = () => env.ADMIN_IDLE_MINUTES * 60 * 1000;
const generation = async () => Number(await kv.get(GEN_KEY)) || 0;

export async function createSession() {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const session = { createdAt: now, lastSeen: now, gen: await generation() };
  await kv.set(sessionKey(token), JSON.stringify(session), ABSOLUTE_MS());
  return token;
}

/** Returns the session if valid; refreshes its idle timer. */
export async function getSession(token) {
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const raw = await kv.get(sessionKey(token));
  if (!raw) return null;
  const s = JSON.parse(raw);
  const now = Date.now();
  if (now - s.lastSeen > IDLE_MS() || now - s.createdAt > ABSOLUTE_MS() || s.gen !== (await generation())) {
    await kv.del(sessionKey(token));
    return null;
  }
  s.lastSeen = now;
  await kv.set(sessionKey(token), JSON.stringify(s), ABSOLUTE_MS() - (now - s.createdAt));
  return s;
}

export const destroySession = (token) => (token ? kv.del(sessionKey(token)) : Promise.resolve());

/** Invalidates every session (including the current one). */
export async function revokeAllSessions() {
  await kv.set(GEN_KEY, String((await generation()) + 1));
}

// ---------- cookie helpers ----------
export function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) {
      try {
        return decodeURIComponent(v.join('='));
      } catch {
        return ''; // malformed cookie: treat as signed out, never a 500
      }
    }
  }
  return '';
}

export function sessionCookie(token, maxAgeSeconds) {
  return [
    `${env.ADMIN_COOKIE_NAME}=${token}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
    env.isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}
