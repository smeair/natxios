const env = import.meta.env;

/* Legal details come from client/.env (see .env.example). */
export const LEGAL = {
  name: env.VITE_LEGAL_NAME || 'Natxios',
  email: env.VITE_CONTACT_EMAIL || '',
  jurisdiction: env.VITE_LEGAL_JURISDICTION || 'England and Wales',
  updated: env.VITE_LEGAL_UPDATED || '',
};
