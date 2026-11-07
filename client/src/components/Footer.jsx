import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { SOCIALS } from '../lib/social.js';
import { openCookieSettings } from '../lib/consent.js';
import { Link } from '../lib/router.jsx';

const EXPLORE = [
  { label: 'Animal quiz', href: '/quiz' },
  { label: 'Fact of the day', href: '/#fact' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p className="footer__tagline">Mindblowing facts from the animal world, every single week.</p>
          <ul className="footer__icons" aria-label="Natxios on social media">
            {SOCIALS.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Natxios on ${s.name}`}>
                  <Icon name={s.icon} size={20} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer__col" aria-labelledby="footer-explore">
          <p id="footer-explore" className="footer__heading">Explore</p>
          <ul>
            {EXPLORE.map((l) => (
              <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
            ))}
            <li><span className="footer__muted">Shop <span className="badge">Soon</span></span></li>
            <li><span className="footer__muted">Donate <span className="badge">Soon</span></span></li>
          </ul>
        </nav>

        <nav className="footer__col" aria-labelledby="footer-follow">
          <p id="footer-follow" className="footer__heading">Follow</p>
          <ul>
            {SOCIALS.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.name} <Icon name="external" size={13} className="footer__ext" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <p className="footer__heading">Site</p>
          <ul>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Use</Link></li>
            <li><button type="button" className="footer__btn" onClick={openCookieSettings}>Cookie settings</button></li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} Natxios. All rights reserved.</p>
        <p>Made for curious minds and animal lovers.</p>
      </div>
    </footer>
  );
}
