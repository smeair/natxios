import crypto from 'node:crypto';

/* Time-based one-time passwords (RFC 6238), compatible with Google Authenticator, Authy, 1Password. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of str.replace(/=+$/, '').toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function codeAt(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 10 ** DIGITS).padStart(DIGITS, '0');
}

/**
 * Checks a code against the current 30s step and one step either side (clock drift).
 * Returns the matching step number (so callers can block reuse), or null.
 */
export function verifyTotp(secret, code, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(now / 1000 / STEP_SECONDS);
  for (const s of [step - 1, step, step + 1]) {
    const expected = Buffer.from(codeAt(secret, s));
    if (crypto.timingSafeEqual(expected, Buffer.from(code))) return s;
  }
  return null;
}

export const newTotpSecret = () => base32Encode(crypto.randomBytes(20));
