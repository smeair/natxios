import { z } from 'zod';

/*
 * Every setting the server uses comes from environment variables, validated here.
 * Modules import `env` instead of hard coding values. Defaults are safe for local
 * development; every variable is documented in server/.env.example.
 */
const int = (def, min = 0) => z.coerce.number().int().min(min).default(def);
const list = (def) =>
  z
    .string()
    .default(def)
    .transform((s) => s.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean));

const schema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: int(4000, 1),
  LOG_FORMAT: z.string().default(''),
  CLIENT_DIST_PATH: z.string().default('../client/dist'),

  // Redis (optional: shared rate limits, quiz counters, bans, tokens and caches)
  REDIS_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional()),
  // Defaults to true in production (limits, lockouts and single-use tokens must be shared and persistent).
  REDIS_REQUIRED: z.preprocess((v) => (v === undefined || v === '' ? undefined : v === 'true' || v === true), z.boolean().optional()),
  REDIS_KEY_PREFIX: z.string().default('natxios:'),
  // Refuse to start if Redis is set to evict keys (evicted bans, lockouts or session revocations would be lost).
  // Defaults to true in production.
  REDIS_REQUIRE_NOEVICTION: z.preprocess((v) => (v === undefined || v === '' ? undefined : v === 'true' || v === true), z.boolean().optional()),
  REDIS_CONNECT_TIMEOUT_MS: int(5000, 500),

  // Database (optional for now: without it the newsletter returns 503)
  MONGODB_URI: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),

  // CORS / CSRF
  ALLOWED_ORIGINS: list('http://localhost:5173,http://localhost:4000'),
  CORS_MAX_AGE_SECONDS: int(600),

  // Secrets
  FORM_TOKEN_SECRET: z.string().min(32, 'FORM_TOKEN_SECRET must be at least 32 characters'),
  IP_HASH_SALT: z.string().min(32, 'IP_HASH_SALT must be at least 32 characters'),
  QUIZ_SECRET: z.string().min(32, 'QUIZ_SECRET must be at least 32 characters'),
  FACT_ROTATION_SEED: z.string().min(8).default('natxios-fact-of-the-day'),
  // Decrypts the question bank (questions.enc). Required in production.
  BANK_ENCRYPTION_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(32, 'BANK_ENCRYPTION_KEY must be at least 32 characters').optional()),

  // Proxy and HTTP limits
  TRUST_PROXY: int(0),
  JSON_BODY_LIMIT: z.string().default('10kb'),
  MAX_HEADER_SIZE_BYTES: int(8192, 1024),
  HEADERS_TIMEOUT_MS: int(15000, 1000),
  REQUEST_TIMEOUT_MS: int(30000, 1000),
  KEEP_ALIVE_TIMEOUT_MS: int(5000, 1000),
  MAX_REQUESTS_PER_SOCKET: int(200, 1),
  HSTS_MAX_AGE_SECONDS: int(63072000),
  SHUTDOWN_TIMEOUT_MS: int(10000, 1000),
  DB_SERVER_SELECTION_TIMEOUT_MS: int(10000, 1000),

  // Rate limits (requests per window, per IP)
  RATE_LIMIT_WINDOW_MINUTES: int(15, 1),
  RATE_LIMIT_SITE: int(1000, 1),
  RATE_LIMIT_API: int(300, 1),
  API_SLOWDOWN_AFTER: int(120, 1),
  API_SLOWDOWN_STEP_MS: int(200),
  API_SLOWDOWN_MAX_MS: int(3000),
  RATE_LIMIT_FACTS: int(60, 1),
  RATE_LIMIT_FORM_TOKEN: int(30, 1),
  RATE_LIMIT_QUIZ_STATUS: int(120, 1),
  RATE_LIMIT_QUIZ_ROUND: int(30, 1),
  RATE_LIMIT_QUIZ_ANSWER: int(120, 1),
  RATE_LIMIT_NEWSLETTER_PER_HOUR: int(5, 1),

  // Abuse guard (IPs probing attack paths)
  ABUSE_MAX_PROBES: int(5, 1),
  ABUSE_WINDOW_MINUTES: int(10, 1),
  ABUSE_BAN_MINUTES: int(60, 1),

  // Form tokens (bot protection)
  FORM_TOKEN_MIN_AGE_SECONDS: int(2),
  FORM_TOKEN_MAX_AGE_MINUTES: int(120, 1),

  // Logging (errors only are written to file)
  LOG_DIR: z.string().default('logs'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_MAX_SIZE_MB: int(5, 1),
  LOG_MAX_FILES: int(5, 1),

  // Admin (disabled unless both are set)
  ADMIN_EMAIL: z.preprocess((v) => (v === '' ? undefined : v), z.string().email().optional()),
  // Development only: plain password. Production must use ADMIN_PASSWORD_HASH (npm run admin:hash).
  ADMIN_PASSWORD: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters').optional()),
  ADMIN_PASSWORD_HASH: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/, 'ADMIN_PASSWORD_HASH must come from npm run admin:hash').optional()),
  // Two-factor (TOTP) secret from npm run admin:2fa. Required in production.
  ADMIN_TOTP_SECRET: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^[A-Z2-7]{16,64}$/, 'ADMIN_TOTP_SECRET must be base32 from npm run admin:2fa').optional()),
  ADMIN_IDLE_MINUTES: int(30, 5),
  // Optional comma separated IPs allowed to use the admin area (empty = any IP).
  ADMIN_IP_ALLOWLIST: z.string().default('').transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
  ADMIN_FAILED_LOGIN_DELAY_MS: int(600),
  ADMIN_SESSION_TTL_MINUTES: int(120, 5),
  ADMIN_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_]+$/).default('nx_admin'),
  RATE_LIMIT_ADMIN_LOGIN: int(5, 1),
  ADMIN_LOCKOUT_AFTER_FAILS: int(10, 1),
  ADMIN_LOCKOUT_MINUTES: int(30, 1),

  // Visitor metrics (anonymous daily counts, no cookies)
  METRICS_RETENTION_DAYS: int(90, 1),

  // Email (SMTP). Leave SMTP_HOST empty to disable sending; contact messages are still saved to MongoDB.
  SMTP_HOST: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  SMTP_PORT: int(587, 1),
  SMTP_SECURE: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  // Require STARTTLS on port 587 (keep true in production).
  SMTP_REQUIRE_TLS: z.preprocess((v) => v !== 'false' && v !== false, z.boolean()).default(true),
  SMTP_USER: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  SMTP_PASS: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  MAIL_FROM: z.string().default('Natxios website <no-reply@natxios.org>'),

  // Contact form
  CONTACT_TO: z.string().email().default('info@natxios.org'),
  RATE_LIMIT_CONTACT_PER_HOUR: int(3, 1),
  CONTACT_MAX_PER_EMAIL_PER_DAY: int(5, 1),
  CONTACT_MAX_LINKS: int(2),
  CONTACT_RETENTION_DAYS: int(365, 1),
  // Global cap on contact emails per hour (stops inbox flooding); extra messages are still saved.
  CONTACT_MAX_EMAILS_PER_HOUR: int(20, 1),

  // Quiz
  QUIZ_QUESTIONS_PER_ROUND: int(10, 1),
  QUIZ_ROUNDS_PER_DAY: int(2, 1),
  QUIZ_ROUNDS_PER_NETWORK_PER_DAY: int(6, 1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const isProd = parsed.data.NODE_ENV === 'production';
const env = Object.freeze({
  ...parsed.data,
  isProd,
  redisRequired: parsed.data.REDIS_REQUIRED ?? isProd,
});

// Behind a proxy, a wrong TRUST_PROXY makes every visitor share one IP (one attacker could get
// everyone banned) or lets visitors fake their IP. Production must state it explicitly.
if (isProd && (process.env.TRUST_PROXY === undefined || process.env.TRUST_PROXY === '')) {
  console.error('TRUST_PROXY must be set explicitly in production (0 if no proxy, 1 behind one proxy such as Render, Railway or Nginx, 2 with Cloudflare in front of that).');
  process.exit(1);
}

if (env.isProd && !env.BANK_ENCRYPTION_KEY) {
  console.error('BANK_ENCRYPTION_KEY is required in production.');
  process.exit(1);
}

if (env.isProd && env.ADMIN_EMAIL) {
  if (!env.ADMIN_PASSWORD_HASH || env.ADMIN_PASSWORD) {
    console.error('Production admin must use ADMIN_PASSWORD_HASH (npm run admin:hash) and no plain ADMIN_PASSWORD.');
    process.exit(1);
  }
  if (!env.ADMIN_TOTP_SECRET) {
    console.error('Production admin requires two-factor login: set ADMIN_TOTP_SECRET (npm run admin:2fa).');
    process.exit(1);
  }
}

if (env.isProd && /change-me/i.test(env.FORM_TOKEN_SECRET + env.IP_HASH_SALT + env.QUIZ_SECRET + (env.BANK_ENCRYPTION_KEY || ''))) {
  console.error('Refusing to start in production with placeholder secrets.');
  process.exit(1);
}

export default env;
