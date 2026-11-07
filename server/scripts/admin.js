#!/usr/bin/env node
/*
 * Admin security helpers.
 *   npm run admin:hash   prompts for a password, prints ADMIN_PASSWORD_HASH=...
 *   npm run admin:2fa    prints a new ADMIN_TOTP_SECRET and the setup link for your authenticator app
 */
import readline from 'node:readline';
import { hashPassword } from '../src/modules/admin/password.js';
import { newTotpSecret } from '../src/modules/admin/totp.js';

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '');
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const cmd = process.argv[2];
if (cmd === 'hash') {
  const pw = await askHidden('New admin password (16+ characters): ');
  if (pw.length < 16) {
    console.error('Too short: use at least 16 characters.');
    process.exit(1);
  }
  const again = await askHidden('Repeat password: ');
  if (pw !== again) {
    console.error('Passwords do not match.');
    process.exit(1);
  }
  console.log('\nPut this in server/.env (and remove ADMIN_PASSWORD):\n');
  console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(pw)}\n`);
} else if (cmd === '2fa') {
  const secret = newTotpSecret();
  const email = process.env.ADMIN_EMAIL || 'admin';
  const uri = `otpauth://totp/${encodeURIComponent(`Natxios:${email}`)}?secret=${secret}&issuer=Natxios&algorithm=SHA1&digits=6&period=30`;
  console.log('\n1. In your authenticator app, add an account and choose "enter a setup key":');
  console.log(`   Account: Natxios admin\n   Key:     ${secret}\n   Type:    Time based\n`);
  console.log('   (or open this link on your phone if your app supports it)');
  console.log(`   ${uri}\n`);
  console.log('2. Put this in server/.env, then restart the server:\n');
  console.log(`ADMIN_TOTP_SECRET=${secret}\n`);
} else {
  console.error('Usage: node scripts/admin.js <hash|2fa>');
  process.exit(1);
}
