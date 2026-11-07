import { useEffect } from 'react';
import Hero from '../components/Hero.jsx';
import Ticker from '../components/Ticker.jsx';
import FactOfDay from '../components/FactOfDay.jsx';
import Quiz from '../components/Quiz.jsx';
import Newsletter from '../components/Newsletter.jsx';
import useFactOfDay from '../hooks/useFactOfDay.js';

export default function HomePage() {
  const { status, data, reload } = useFactOfDay();

  useEffect(() => {
    document.title = 'Natxios | Animal facts';
  }, []);

  return (
    <>
      <Hero />
      <Ticker items={data?.ticker || []} />
      <section className="section explore" aria-label="Animal quiz and fact of the day">
        <div className="container explore__grid">
          <Quiz />
          <FactOfDay status={status} data={data} onRetry={reload} />
        </div>
      </section>
      <Newsletter />
    </>
  );
}
