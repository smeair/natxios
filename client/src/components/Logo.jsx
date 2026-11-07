import { Link } from '../lib/router.jsx';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`logo ${className}`.trim()}>
      <img src="/logo-white.png" alt="Natxios" width="619" height="139" />
    </Link>
  );
}
