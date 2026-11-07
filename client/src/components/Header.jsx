import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { Link, usePath } from '../lib/router.jsx';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Quiz', href: '/quiz' },
  { label: 'Contact', href: '/contact' },
];

// Not live yet: shown greyed out with a "Soon" badge.
const SOON = [
  { label: 'Shop', title: 'Our shop opens soon' },
  { label: 'Donate', title: 'Donations open soon' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePath();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="header">
      <div className="container header__inner">
        <Logo />

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} size={24} />
        </button>

        <nav id="site-nav" className={`nav${open ? ' nav--open' : ''}`} aria-label="Main">
          <ul className="nav__list">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`nav__link${path === item.href ? ' is-active' : ''}`}
                  aria-current={path === item.href ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {SOON.map((item) => (
              <li key={item.label}>
                <span className="nav__donate" role="link" aria-disabled="true" title={item.title}>
                  {item.label} <span className="badge">Soon</span>
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
