import env from '../../config/env.js';
import { HttpError } from '../../common/utils/httpError.js';
import * as auth from './admin.auth.js';
import * as service from './admin.service.js';
import * as contact from '../contact/contact.service.js';

const GENERIC = 'Incorrect email or password.';

const GENERIC_2FA = 'Incorrect email, password or code.';

export function authConfig(_req, res) {
  res.json({ twoFactor: auth.totpEnabled() });
}

export async function login(req, res) {
  const { email, password, code } = req.valid.body;
  const who = { ip: req.ip, userAgent: req.get('user-agent') };
  if (await auth.registerAttempt(email, req.ip)) {
    await auth.recordSignIn({ ...who, ok: false, reason: 'locked out' });
    throw new HttpError(429, `Too many failed attempts. Try again in ${env.ADMIN_LOCKOUT_MINUTES} minutes.`);
  }
  if (!(await auth.checkCredentials(email, password, code))) {
    await auth.recordSignIn({ ...who, ok: false, reason: 'wrong details' });
    throw new HttpError(401, auth.totpEnabled() ? GENERIC_2FA : GENERIC);
  }
  await auth.clearAttempts(email, req.ip);
  await auth.recordSignIn({ ...who, ok: true });
  // Always a brand new session on sign in (old cookie values can't be reused).
  await auth.destroySession(auth.readCookie(req, env.ADMIN_COOKIE_NAME));
  const token = await auth.createSession();
  res.set('Set-Cookie', auth.sessionCookie(token, env.ADMIN_SESSION_TTL_MINUTES * 60));
  res.json({ ok: true, email: env.ADMIN_EMAIL });
}

export async function logout(req, res) {
  await auth.destroySession(req.adminToken);
  res.set('Set-Cookie', auth.sessionCookie('', 0));
  res.json({ ok: true });
}

export function me(_req, res) {
  res.json({ email: env.ADMIN_EMAIL, twoFactor: auth.totpEnabled() });
}

export async function logoutEverywhere(_req, res) {
  await auth.revokeAllSessions();
  res.set('Set-Cookie', auth.sessionCookie('', 0));
  res.json({ ok: true });
}

export async function signIns(_req, res) {
  res.json({ items: await auth.signInHistory() });
}

export async function overview(req, res) {
  res.json(await service.overview(req.valid.query.days));
}

export async function health(_req, res) {
  res.json(await service.health());
}

export async function subscribers(req, res) {
  res.json(await service.listSubscribers(req.valid.query));
}

export async function subscribersCsv(req, res) {
  const csv = await service.subscribersCsv(req.valid.query);
  if (csv === null) throw new HttpError(503, 'The database is not connected.');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="natxios-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
}

export async function messages(req, res) {
  res.json(await contact.list(req.valid.query));
}

export async function messageRead(req, res) {
  await contact.markRead(req.valid.params.id);
  res.json({ ok: true });
}

export async function messageDelete(req, res) {
  await contact.remove(req.valid.params.id);
  res.json({ ok: true });
}

export async function errors(req, res) {
  res.json({ items: await service.readErrors(req.valid.query.limit) });
}
