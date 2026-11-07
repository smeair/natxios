import { useEffect, useState } from 'react';

/*
 * A tiny router for a tiny site: two pages and a 404, no extra library.
 * <Link> handles in-site links (including "/#section") without a full reload.
 */
const NAV_EVENT = 'natxios:navigate';

function scrollToHash(hash) {
  if (!hash) {
    window.scrollTo({ top: 0 });
    return;
  }
  requestAnimationFrame(() => {
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function navigate(to) {
  const url = new URL(to, window.location.origin);
  const samePath = url.pathname === window.location.pathname;
  if (url.href !== window.location.href) window.history.pushState({}, '', url);
  window.dispatchEvent(new Event(NAV_EVENT));
  if (samePath && url.hash) scrollToHash(url.hash);
  else requestAnimationFrame(() => scrollToHash(url.hash));
}

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function Link({ to, onClick, children, ...rest }) {
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

/** Scroll to the #hash on first load (the browser can't, because content renders after). */
export function useInitialHashScroll() {
  useEffect(() => {
    if (window.location.hash) setTimeout(() => scrollToHash(window.location.hash), 150);
  }, []);
}
