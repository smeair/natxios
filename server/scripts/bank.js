#!/usr/bin/env node
/*
 * Encrypt or decrypt the question bank.
 *   npm run bank:encrypt   questions.json -> questions.enc  (commit the .enc file)
 *   npm run bank:decrypt   questions.enc  -> questions.json (gitignored, for editing)
 * Needs BANK_ENCRYPTION_KEY in server/.env.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { encryptBank, decryptBank } from '../src/modules/bank/bankCrypto.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/modules/bank');
const plain = path.join(dir, 'questions.json');
const enc = path.join(dir, 'questions.enc');
const key = process.env.BANK_ENCRYPTION_KEY;

if (!key || key.length < 32) {
  console.error('BANK_ENCRYPTION_KEY (32+ characters) must be set in server/.env');
  process.exit(1);
}

const cmd = process.argv[2];
if (cmd === 'encrypt') {
  if (!existsSync(plain)) throw new Error(`Missing ${plain}`);
  const json = readFileSync(plain, 'utf8');
  const count = JSON.parse(json).length;
  writeFileSync(enc, encryptBank(json, key) + '\n');
  console.log(`Encrypted ${count} items -> questions.enc`);
} else if (cmd === 'decrypt') {
  const json = decryptBank(readFileSync(enc, 'utf8').trim(), key);
  writeFileSync(plain, json.endsWith('\n') ? json : `${json}\n`);
  console.log(`Decrypted ${JSON.parse(json).length} items -> questions.json`);
} else {
  console.error('Usage: node scripts/bank.js <encrypt|decrypt>');
  process.exit(1);
}
