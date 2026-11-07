import { useEffect } from 'react';
import Quiz from '../components/Quiz.jsx';
import Newsletter from '../components/Newsletter.jsx';

export default function QuizPage() {
  useEffect(() => {
    document.title = 'Animal quiz | Natxios';
    // Keep the quiz out of search results (the server also sends X-Robots-Tag).
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <>
      <section className="page-head" aria-labelledby="page-title">
        <div className="container page-head__inner">
          <p className="hero__kicker"><span className="hero__dot" aria-hidden="true" />Animal quiz</p>
          <h1 id="page-title" className="page-head__title">Think you know animals?</h1>
          <p className="page-head__lead">
            Every question comes from our own bank of real, checked facts.
          </p>
        </div>
      </section>
      <section className="section quiz-page" aria-label="Quiz">
        <div className="container quiz-page__inner">
          <Quiz />
        </div>
      </section>
      <Newsletter />
    </>
  );
}
