import helmet from 'helmet';
import cors from 'cors';
import env from '../../config/env.js';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': env.isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: env.isProd ? { maxAge: env.HSTS_MAX_AGE_SECONDS, includeSubDomains: true, preload: true } : false,
});

export const corsMiddleware = cors({
  origin(origin, cb) {
    // Same-origin requests and non-browser clients send no Origin header.
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: env.CORS_MAX_AGE_SECONDS,
});

export function permissionsPolicy(_req, res, next) {
  // Machine readable reservation of rights against text and data mining / AI training (TDMRep).
  res.setHeader('tdm-reservation', '1');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  next();
}
