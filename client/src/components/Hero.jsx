import Icon from './Icon.jsx';
import { Link } from '../lib/router.jsx';
import { SOCIALS } from '../lib/social.js';

export default function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <p className="hero__kicker">
          <span className="hero__dot" aria-hidden="true" />
          For curious minds and animal lovers
        </p>
        <h1 id="hero-title" className="hero__title">
          Discover mindblowing facts from the animal world.
        </h1>
        <p className="hero__lead">
          Strange, surprising and little known facts, shared every week on Instagram, Facebook
          and YouTube.
        </p>
        <div className="hero__actions">
          <Link to="/quiz" className="btn btn--primary btn--chip">
            Animal quiz
            <span className="btn__chip" aria-hidden="true"><Icon name="arrow" size={16} /></span>
          </Link>
          <a href="#newsletter" className="btn btn--ghost">
            Newsletter
            <Icon name="arrow" size={16} className="btn__arrow" />
          </a>
        </div>
        <ul className="hero__socials" aria-label="Follow Natxios">
          {SOCIALS.map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Natxios on ${s.name} (${s.handle})`}>
                <Icon name={s.icon} size={26} />
                <span className="hero__social-name" aria-hidden="true">{s.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
