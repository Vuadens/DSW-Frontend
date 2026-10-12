import { Link } from 'react-router-dom';

export function Logo({ sub, to = '/' }: { sub?: string; to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="Hades, ir al inicio">
      <picture className="brand-mark">
        <source media="(prefers-color-scheme: dark)" srcSet="/hades-logo-dark.svg" />
        <img src="/hades-logo.svg" alt="" className="brand-logo brand-logo-light" />
        <img src="/hades-logo-dark.svg" alt="" className="brand-logo brand-logo-dark" />
      </picture>
      <span>Hades</span>
      {sub && <small>{sub}</small>}
    </Link>
  );
}
