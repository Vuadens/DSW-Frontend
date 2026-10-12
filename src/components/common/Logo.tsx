import { Link } from 'react-router-dom';

export function Logo({ sub, to = '/' }: { sub?: string; to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="Hades, ir al inicio">
      <img src="/hades-logo.svg" alt="" className="brand-logo" />
      <span>Hades</span>
      {sub && <small>{sub}</small>}
    </Link>
  );
}
