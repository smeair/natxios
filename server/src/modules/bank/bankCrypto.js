import crypto from 'node:crypto';
import zlib from 'node:zlib';

/*
 * The question bank is stored encrypted (AES-256-GCM) so the repo never holds it in plain text.
 * File format: "NXB1." + base64url( iv[12] | authTag[16] | ciphertext(gzip(json)) )
 */
const MAGIC = 'NXB1.';

const keyFrom = (secret) => crypto.createHash('sha256').update(`natxios-bank:${secret}`).digest();

export function encryptBank(json, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const body = Buffer.concat([cipher.update(zlib.gzipSync(Buffer.from(json, 'utf8'))), cipher.final()]);
  return MAGIC + Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

export function decryptBank(payload, secret) {
  if (!payload.startsWith(MAGIC)) throw new Error('Not a Natxios bank file');
  const raw = Buffer.from(payload.slice(MAGIC.length), 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFrom(secret), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  const gz = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
  return zlib.gunzipSync(gz).toString('utf8');
}
