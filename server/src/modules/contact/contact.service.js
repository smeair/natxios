import env from '../../config/env.js';
import { isDBReady } from '../../config/db.js';
import { mailer, mailEnabled } from '../../config/mailer.js';
import { kv } from '../../common/store/kv.js';
import { hashIp } from '../../common/utils/hash.js';
import { networkOf } from '../../common/utils/network.js';
import { HttpError } from '../../common/utils/httpError.js';
import { logger } from '../../common/logger.js';
import { verifyFormToken } from '../formToken/formToken.service.js';
import { track } from '../metrics/metrics.service.js';
import ContactMessage, { retentionDate } from './contactMessage.model.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|ru|xyz|top|info|io|biz|click|link)\b)/gi;

/** Plain text email body; nothing from the visitor can become HTML or a header. */
function emailText({ name, email, subject, message }) {
  return [
    'New message from the Natxios contact form',
    '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Subject: ${subject}`,
    '',
    message,
    '',
    '--',
    'Reply to this email to answer the sender directly.',
  ].join('\n');
}

/**
 * Accepts a contact message. Quietly accepts (and drops) obvious bots so they learn nothing.
 * Saves to MongoDB when connected and emails CONTACT_TO when SMTP is configured.
 */
export async function submit(input, { ip, userAgent }) {
  if (input.website) return; // honeypot tripped

  if (!(await verifyFormToken(input.formToken)).ok) {
    throw new HttpError(400, 'Your session expired. Please refresh the page and try again.');
  }

  const links = (input.message.match(LINK) || []).length;
  if (links > env.CONTACT_MAX_LINKS) {
    throw new HttpError(400, `Please include no more than ${env.CONTACT_MAX_LINKS} links in your message.`);
  }

  // Per address daily cap (on top of the per IP rate limit).
  // Keyed by email AND network, so nobody can block a specific person's address from elsewhere.
  const perEmail = await kv.incr(`contact:email:${hashIp(`${input.email}|${networkOf(ip)}`)}`, DAY_MS);
  if (perEmail > env.CONTACT_MAX_PER_EMAIL_PER_DAY) {
    throw new HttpError(429, 'You have sent several messages today. We will reply as soon as we can.');
  }

  // Global cap on outgoing contact emails (stops a botnet flooding the inbox or burning the SMTP account).
  const hourKey = `contact:emails:${new Date().toISOString().slice(0, 13)}`;
  const emailsThisHour = mailEnabled() ? await kv.incr(hourKey, 60 * 60 * 1000) : 0;
  const overEmailCap = emailsThisHour > env.CONTACT_MAX_EMAILS_PER_HOUR;
  if (overEmailCap) logger.warn(`Contact email cap reached (${env.CONTACT_MAX_EMAILS_PER_HOUR}/hour): saving without emailing.`);

  if (!isDBReady() && (!mailEnabled() || overEmailCap)) {
    throw new HttpError(503, `The contact form is unavailable right now. Please email ${env.CONTACT_TO} instead.`);
  }

  let saved = null;
  if (isDBReady()) {
    saved = await ContactMessage.create({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      ipHash: hashIp(ip),
      userAgent: (userAgent || '').slice(0, 300),
      expiresAt: retentionDate(),
    });
  }

  if (mailEnabled() && !overEmailCap) {
    try {
      await mailer.sendMail({
        from: env.MAIL_FROM,
        to: env.CONTACT_TO,
        replyTo: { name: input.name, address: input.email },
        subject: `[Natxios contact] ${input.subject}`,
        text: emailText(input),
      });
      if (saved) await ContactMessage.updateOne({ _id: saved._id }, { $set: { emailed: true } });
    } catch (err) {
      logger.error(`Contact email failed: ${err.message}`, { path: '/api/contact', status: 500 });
      if (!saved) throw new HttpError(503, `We could not send your message. Please email ${env.CONTACT_TO} instead.`);
    }
  }

  track('contact_messages');
}

// ---------- admin ----------
const PAGE_SIZE = 30;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function list({ search, status, page }) {
  if (!isDBReady()) return { available: false, items: [], total: 0, page: 1, pages: 1, unread: 0 };
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ email: re }, { name: re }, { message: re }];
  }
  const [total, unread, items] = await Promise.all([
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ status: 'new' }),
    ContactMessage.find(filter, { name: 1, email: 1, subject: 1, message: 1, status: 1, emailed: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);
  return {
    available: true,
    total,
    unread,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: items.map(({ _id, ...m }) => ({ id: String(_id), ...m })),
  };
}

export async function markRead(id) {
  if (!isDBReady()) throw new HttpError(503, 'The database is not connected.');
  await ContactMessage.updateOne({ _id: id }, { $set: { status: 'read' } });
}

export async function remove(id) {
  if (!isDBReady()) throw new HttpError(503, 'The database is not connected.');
  await ContactMessage.deleteOne({ _id: id });
}
