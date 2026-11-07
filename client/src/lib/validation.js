/*
 * Form validation rules. Keep in sync with the server schemas
 * (server/src/modules/newsletter/newsletter.schemas.js). The server always re-checks.
 */
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
const NAME_RE = /^[\p{L}\p{M}' .-]*$/u;

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Please enter your email.';
  if (email.length > 254) return 'That email is too long.';
  if (/\s/.test(email)) return 'Emails can’t contain spaces.';
  if (!email.includes('@')) return 'Your email needs an @ sign.';
  if (email.includes('..')) return 'That email has two dots in a row.';
  const [local] = email.split('@');
  if (local.length > 64) return 'The part before the @ is too long.';
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  return '';
}

export function validateName(value) {
  const name = value.trim();
  if (name.length > 60) return 'Name must be 60 characters or fewer.';
  if (!NAME_RE.test(name)) return 'Please use letters only in your name.';
  return '';
}

export const validateConsent = (checked) => (checked ? '' : 'Please tick the box to confirm.');

// Common email domain typos: suggest a fix, never block.
const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'aol.com', 'yahoo.co.uk', 'hotmail.co.uk', 'protonmail.com'];

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/** "ada@gmial.com" → "ada@gmail.com", or '' when there's nothing to suggest. */
export function suggestEmail(value) {
  const email = value.trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at < 1) return '';
  const domain = email.slice(at + 1);
  if (!domain || DOMAINS.includes(domain)) return '';
  let best = '';
  let bestScore = 3;
  for (const d of DOMAINS) {
    const score = distance(domain, d);
    if (score < bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best ? `${email.slice(0, at)}@${best}` : '';
}

// Contact form (mirror server/src/modules/contact/contact.schemas.js)
export const CONTACT_SUBJECTS = ['General question', 'Fact correction', 'Partnership or collaboration', 'Press', 'Something else'];
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u2028\\u2029]');
const LINKS = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|ru|xyz|top|info|io|biz|click|link)\b)/gi;

export function validateContactName(value) {
  const name = value.trim();
  if (name.length < 2) return 'Please enter your name.';
  if (name.length > 80) return 'Name must be 80 characters or fewer.';
  if (/[\r\n]/.test(name) || CONTROL.test(name) || !/^[\p{L}\p{M}' .-]+$/u.test(name)) return 'Please use letters only in your name.';
  return '';
}

export const validateSubject = (v) => (CONTACT_SUBJECTS.includes(v) ? '' : 'Please choose a subject.');

export function validateMessage(value, maxLinks = 2) {
  const msg = value.trim();
  if (msg.length < 20) return 'Please write at least 20 characters.';
  if (msg.length > 4000) return 'Message must be 4,000 characters or fewer.';
  if (CONTROL.test(msg)) return 'Message contains invalid characters.';
  if ((msg.match(LINKS) || []).length > maxLinks) return `Please include no more than ${maxLinks} links.`;
  return '';
}
