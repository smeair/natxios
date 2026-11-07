import { useCallback, useEffect, useRef, useState } from 'react';
import { checkAnswer, getQuiz, getQuizStatus } from '../lib/api.js';
import { getPlayerId } from '../lib/quizProgress.js';
import useInView from '../hooks/useInView.js';
import useCountdown from '../hooks/useCountdown.js';
import Icon from './Icon.jsx';
import ShareScore from './ShareScore.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];
const ALLOWANCE_EVENT = 'natxios:quiz-allowance';

function scoreMessage(score, total) {
  if (score === total) return 'Perfect score. You really know your animals.';
  if (score >= total - 1) return 'So close. Nearly a perfect round.';
  if (score >= Math.ceil(total / 2)) return 'Nicely done. A few surprises in there.';
  return 'Plenty you didn’t know. That’s what we’re here for.';
}

const roundsLeftText = (n) => (n === 1 ? '1 round left today' : `${n} rounds left today`);

function NewsletterCta() {
  return (
    <div className="quiz__cta">
      <p className="quiz__cta-title">Want more like this?</p>
      <p className="quiz__cta-text">
        Get the best animal facts we find in your inbox, once a week. Free, and you can unsubscribe any time.
      </p>
      <a href="#newsletter" className="btn btn--primary btn--chip">
        Join the newsletter
        <span className="btn__chip" aria-hidden="true"><Icon name="arrow" size={16} /></span>
      </a>
    </div>
  );
}

export default function Quiz() {
  const [phase, setPhase] = useState('intro'); // intro | loading | playing | done | error
  const [allowance, setAllowance] = useState(null); // { remaining, limit, resetAt }
  const [questions, setQuestions] = useState([]);
  const roundTokenRef = useRef('');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]); // true/false per question, for the scorecard
  const [error, setError] = useState('');
  const [cardRef, cardIn] = useInView();
  const questionRef = useRef(null);
  const nextRef = useRef(null);
  const countdown = useCountdown(allowance?.resetAt);

  // Share the allowance between the quiz on the home page and the quiz page.
  const publish = useCallback((a) => {
    setAllowance(a);
    window.dispatchEvent(new CustomEvent(ALLOWANCE_EVENT, { detail: a }));
  }, []);

  useEffect(() => {
    let alive = true;
    getQuizStatus(getPlayerId())
      .then((a) => alive && setAllowance(a))
      .catch(() => {});
    const onUpdate = (e) => setAllowance(e.detail);
    window.addEventListener(ALLOWANCE_EVENT, onUpdate);
    return () => {
      alive = false;
      window.removeEventListener(ALLOWANCE_EVENT, onUpdate);
    };
  }, []);

  const start = async () => {
    setPhase('loading');
    setError('');
    try {
      const data = await getQuiz(getPlayerId());
      publish(data.allowance);
      roundTokenRef.current = data.roundToken;
      setQuestions(data.questions);
      setIndex(0);
      setScore(0);
      setResults([]);
      setPicked(null);
      setResult(null);
      setPhase('playing');
    } catch (err) {
      if (err.code === 'DAILY_LIMIT') {
        publish({ ...(allowance || {}), remaining: 0, resetAt: err.resetAt });
        setPhase('intro');
        return;
      }
      setError(err.message);
      setPhase('error');
    }
  };

  const choose = async (option) => {
    if (picked || checking) return;
    setPicked(option.id);
    setChecking(true);
    try {
      const res = await checkAnswer(roundTokenRef.current, questions[index].id, option.id);
      setResult(res);
      if (res.correct) setScore((s) => s + 1);
      setResults((r) => [...r, res.correct]);
    } catch (err) {
      setPicked(null);
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setPhase('done');
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setResult(null);
    setError('');
  };

  useEffect(() => {
    if (phase === 'playing' && !result) questionRef.current?.focus({ preventScroll: true });
  }, [phase, index, result]);
  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true });
  }, [result]);

  const q = questions[index];
  const total = questions.length || allowance?.questionsPerRound || 0;
  const remaining = allowance?.remaining;
  const outOfRounds = remaining === 0;

  return (
    <section id="quiz" ref={cardRef} className={`quiz__card reveal${cardIn ? ' is-in' : ''}`} style={{ '--i': 1 }} aria-labelledby="quiz-title" data-nosnippet="">
      {(phase === 'intro' || phase === 'loading' || phase === 'error') && (
        <div className="quiz__intro">
          <p className="card__topic">Animal quiz</p>
          {outOfRounds ? (
            <>
              <h2 id="quiz-title" className="section__title">That's today's quiz done.</h2>
              <p className="section__lead">
                You've played all of today's rounds. New rounds unlock in <strong className="quiz__clock">{countdown}</strong>.
              </p>
              <NewsletterCta />
            </>
          ) : (
            <>
              <h2 id="quiz-title" className="section__title">How well do you know animals?</h2>
              {error && <p className="quiz__error" role="alert">{error}</p>}
              <button type="button" className="btn btn--primary btn--chip" onClick={start} disabled={phase === 'loading'}>
                {phase === 'loading' ? 'Loading questions' : phase === 'error' ? 'Try again' : 'Start the quiz'}
                <span className="btn__chip" aria-hidden="true"><Icon name="arrow" size={16} /></span>
              </button>
              {typeof remaining === 'number' && <p className="quiz__allowance">{roundsLeftText(remaining)}</p>}
            </>
          )}
        </div>
      )}

      {phase === 'playing' && q && (
        <div className="quiz__play">
          <h2 id="quiz-title" className="sr-only">Animal quiz</h2>
          <div className="quiz__top">
            <p className="card__topic">{q.topic}</p>
            <p className="quiz__count">Question {index + 1} of {total}</p>
          </div>
          <div className="quiz__steps" aria-hidden="true">
            {questions.map((_, i) => (
              <span key={i} className={i < index || (i === index && result) ? 'is-done' : i === index ? 'is-current' : ''} />
            ))}
          </div>

          <h3 ref={questionRef} tabIndex={-1} className="quiz__question">{q.question}</h3>

          <ul className="quiz__options">
            {q.options.map((o, i) => {
              let state = '';
              if (result) {
                if (o.id === result.correctOptionId) state = ' is-correct';
                else if (o.id === picked) state = ' is-wrong';
                else state = ' is-dim';
              } else if (o.id === picked) state = ' is-picked';
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    className={`quiz__option${state}`}
                    onClick={() => choose(o)}
                    disabled={!!picked}
                    aria-pressed={o.id === picked}
                  >
                    <span className="quiz__letter" aria-hidden="true">{LETTERS[i]}</span>
                    <span>{o.text}</span>
                    {result && o.id === result.correctOptionId && <Icon name="check" size={18} className="quiz__mark" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {error && !result && <p className="quiz__error" role="alert">{error}</p>}

          <div className="quiz__feedback" aria-live="polite">
            {result && (
              <>
                <p className={`quiz__verdict${result.correct ? ' is-correct' : ''}`}>
                  {result.correct ? 'Correct.' : `Not quite. It's ${result.answer.toLowerCase()}.`}
                </p>
                {result.detail && <p className="quiz__detail">{result.detail}</p>}
                <button ref={nextRef} type="button" className="btn btn--primary btn--chip" onClick={next}>
                  {index + 1 >= questions.length ? 'See your score' : 'Next question'}
                  <span className="btn__chip" aria-hidden="true"><Icon name="arrow" size={16} /></span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="quiz__done">
          <h2 id="quiz-title" className="sr-only">Quiz results</h2>
          <p className="card__topic">Your score</p>
          <p className="quiz__score"><span>{score}</span>/{total}</p>
          <p className="section__lead">{scoreMessage(score, total)}</p>
          {outOfRounds ? (
            <p className="quiz__allowance">
              That was your last round today. New rounds unlock in <strong className="quiz__clock">{countdown}</strong>.
            </p>
          ) : (
            <>
              <button type="button" className="btn btn--ghost" onClick={start}>
                Play another round
                <Icon name="shuffle" size={16} />
              </button>
              {typeof remaining === 'number' && <p className="quiz__allowance">{roundsLeftText(remaining)}</p>}
            </>
          )}
          <ShareScore score={score} total={total} results={results} />
          <NewsletterCta />
        </div>
      )}
    </section>
  );
}
