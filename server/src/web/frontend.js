import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import env from '../config/env.js';
import { trackPageView } from '../modules/metrics/metrics.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// CLIENT_DIST_PATH is relative to the server folder (or absolute).
const CLIENT_DIST = path.resolve(__dirname, '../..', env.CLIENT_DIST_PATH);

// Keep in sync with the client's page list (client/src/App.jsx).
const PAGES = new Set(['/', '/quiz', '/contact', '/privacy', '/terms', '/admin']);
// Pages whose content comes from the question bank: never indexed.
const NOINDEX_PAGES = new Set(['/quiz', '/admin']);
// Pages that are not counted in visitor metrics.
const UNTRACKED = new Set(['/admin']);

/** Serves the built React app. Real pages get 200, anything else gets the 404 page with a 404 status. */
export function createFrontendRouter() {
  const web = express.Router();

  // TDMRep: machine readable opt out from text and data mining (served explicitly; dotfiles are otherwise denied).
  web.get('/.well-known/tdmrep.json', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.json([{ location: '/*', 'tdm-reservation': 1 }]);
  });

  web.use('/assets', express.static(path.join(CLIENT_DIST, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
  web.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h', dotfiles: 'deny' }));

  web.get('/{*splat}', (req, res, next) => {
    const p = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
    res.status(PAGES.has(p) ? 200 : 404).set('Cache-Control', 'no-cache');
    if (PAGES.has(p) && !UNTRACKED.has(p)) trackPageView(req, p);
    if (NOINDEX_PAGES.has(p) || !PAGES.has(p)) res.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
      if (err) next(Object.assign(new Error('Frontend not built. Run `npm run build`.'), { status: 404 }));
    });
  });

  return web;
}
