import { useEffect, useRef, useState } from 'react';
import { getConsent, setConsent } from '../lib/consent.js';
import { Link } from '../lib/router.jsx';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const saved = getConsent();
    if (saved) setAnalytics(saved.analytics);
    else {
      const t = window.setTimeout(() => setShowBanner(true), 800);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const open = () => {
      setAnalytics(getConsent()?.analytics ?? false);
      dialogRef.current?.showModal();
    };
    window.addEventListener('natxios:cookie-settings', open);
    return () => window.removeEventListener('natxios:cookie-settings', open);
  }, []);

  const save = (choice) => {
    setConsent({ analytics: choice });
    setAnalytics(choice);
    setShowBanner(false);
    dialogRef.current?.close();
  };

  return (
    <>
      {showBanner && (
        <section className="cookie" role="region" aria-label="Cookie notice">
          <p className="cookie__title">Cookies</p>
          <p className="cookie__text">
            We only use what's needed to run this site. We'd also like to use analytics to see
            which facts people enjoy, but only if you're happy with that.{' '}
            <Link to="/privacy" className="cookie__policy">Privacy Policy</Link>
          </p>
          <div className="cookie__actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => save(true)}>Accept all</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => save(false)}>Essential only</button>
            <button type="button" className="cookie__link" onClick={() => dialogRef.current?.showModal()}>Settings</button>
          </div>
        </section>
      )}

      <dialog ref={dialogRef} className="cookie-dialog" aria-labelledby="cookie-dialog-title">
        <form method="dialog" className="cookie-dialog__inner" onSubmit={(e) => { e.preventDefault(); save(analytics); }}>
          <h2 id="cookie-dialog-title" className="cookie-dialog__title">Cookie settings</h2>
          <p className="cookie-dialog__intro">Choose what Natxios can use. You can change this any time from the footer.</p>

          <div className="cookie-option">
            <div>
              <p className="cookie-option__name">Essential</p>
              <p className="cookie-option__desc">Keeps the site secure and remembers your cookie choice and quiz progress. Always on.</p>
            </div>
            <span className="cookie-option__always">On</span>
          </div>

          <label className="cookie-option" htmlFor="cookie-analytics">
            <div>
              <p className="cookie-option__name">Analytics</p>
              <p className="cookie-option__desc">
                Helps us see which facts and quiz questions people enjoy. We don't run analytics yet;
                your choice applies when we do.
              </p>
            </div>
            <input
              id="cookie-analytics"
              type="checkbox"
              role="switch"
              className="switch"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
          </label>

          <div className="cookie-dialog__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="submit" className="btn btn--primary btn--sm">Save choices</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
