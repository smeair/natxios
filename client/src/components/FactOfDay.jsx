import { useEffect } from 'react';
import useCountdown from '../hooks/useCountdown.js';
import useInView from '../hooks/useInView.js';
import Icon from './Icon.jsx';
import { Link } from '../lib/router.jsx';

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

export default function FactOfDay({ status, data, onRetry }) {
  const [ref, inView] = useInView();
  const countdown = useCountdown(data?.nextAt);
  const fact = data?.fact;

  // If the day rolls over while the page is open, fetch the new fact.
  useEffect(() => {
    if (!data?.nextAt) return undefined;
    const ms = new Date(data.nextAt).getTime() - Date.now() + 2000;
    if (ms <= 0 || ms > 2 ** 31 - 1) return undefined;
    const t = window.setTimeout(onRetry, ms);
    return () => window.clearTimeout(t);
  }, [data?.nextAt, onRetry]);

  const onPointerMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <article
          id="fact"
          ref={ref}
          className={`fact-day reveal${inView ? ' is-in' : ''}${status === 'loading' && !fact ? ' is-loading' : ''}`}
          onPointerMove={onPointerMove}
          aria-busy={status === 'loading'}
          aria-labelledby="fact-title"
          data-nosnippet=""
        >
          <header className="fact-day__head">
            <p className="fact-day__label">
              <span className="fact-day__dot" aria-hidden="true" /> <span id="fact-title">Fact of the day</span>
            </p>
            {data?.date && <p className="fact-day__date">{formatDate(data.date)}</p>}
          </header>

          {status === 'error' && !fact ? (
            <div className="fact-day__body">
              <p className="fact-day__detail">We couldn't load today's fact.</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>Try again</button>
            </div>
          ) : (
            <div className="fact-day__body">
              {fact ? (
                <>
                  <p className="fact-day__topic">{fact.topic}</p>
                  <h2 className="fact-day__title">{fact.title}.</h2>
                  <p className="fact-day__detail">{fact.detail}</p>
                </>
              ) : (
                <div className="fact-day__skeleton" aria-hidden="true">
                  <span /><span /><span />
                </div>
              )}
            </div>
          )}

          <footer className="fact-day__foot">
            <p className="fact-day__next">
              {countdown ? <>Next fact in <strong>{countdown}</strong></> : ' '}
            </p>
            <Link to="/quiz" className="btn btn--ghost btn--sm">
              Test yourself
              <Icon name="arrow" size={15} className="btn__arrow" />
            </Link>
          </footer>
        </article>
  );
}
