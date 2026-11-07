import { useEffect } from 'react';
import { Link } from '../lib/router.jsx';
import Icon from '../components/Icon.jsx';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found | Natxios';
  }, []);

  return (
    <section className="page-head page-head--center" aria-labelledby="page-title">
      <div className="container page-head__inner">
        <p className="hero__kicker"><span className="hero__dot" aria-hidden="true" />404</p>
        <h1 id="page-title" className="page-head__title">This page wandered off.</h1>
        <p className="page-head__lead">The page you're looking for doesn't exist or has moved.</p>
        <div className="hero__actions">
          <Link to="/" className="btn btn--primary btn--chip">
            Back home
            <span className="btn__chip" aria-hidden="true"><Icon name="arrow" size={16} /></span>
          </Link>
          <Link to="/quiz" className="btn btn--ghost">Take the quiz</Link>
        </div>
      </div>
    </section>
  );
}
