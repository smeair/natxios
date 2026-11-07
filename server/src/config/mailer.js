import nodemailer from 'nodemailer';
import env from './env.js';
import { logger } from '../common/logger.js';

/*
 * Outgoing email over SMTP (any provider: Brevo, Mailgun, Postmark, Gmail Workspace, ...).
 * Disabled when SMTP_HOST is empty. Messages are always plain text.
 */
export const mailer = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      requireTLS: !env.SMTP_SECURE && env.SMTP_REQUIRE_TLS,
    })
  : null;

export const mailEnabled = () => Boolean(mailer);

export async function verifyMailer() {
  if (!mailer) {
    logger.warn('SMTP_HOST not set: emails are disabled (contact messages are only saved to the database).');
    return false;
  }
  try {
    await mailer.verify();
    logger.info('SMTP ready');
    return true;
  } catch (err) {
    logger.warn(`SMTP check failed: ${err.message}`);
    return false;
  }
}
