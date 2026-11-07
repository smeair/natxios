/*
 * Cookie consent, stored in localStorage (strictly necessary, so it needs no consent itself).
 * Anything non-essential added later (analytics, embeds) must check hasConsent('analytics')
 * or listen for the 'natxios:consent' event before loading.
 */
const KEY = 'natxios-consent';
const VERSION = 1; // bump to ask everyone again after the policy changes

export function getConsent() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.v === VERSION ? data : null;
  } catch {
    return null;
  }
}

export function setConsent({ analytics }) {
  const data = { v: VERSION, analytics: !!analytics, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage blocked: the choice still applies for this visit */
  }
  window.dispatchEvent(new CustomEvent('natxios:consent', { detail: data }));
  return data;
}

export const hasConsent = (category) => !!getConsent()?.[category];

export const openCookieSettings = () => window.dispatchEvent(new CustomEvent('natxios:cookie-settings'));
