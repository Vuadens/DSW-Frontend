import { Link } from 'react-router-dom';

export function Logo({ sub, to = '/' }: { sub?: string; to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="Hades, ir al inicio">
      <svg viewBox="0 0 28 26" aria-hidden="true">
        <path d="M0 0h8v10h12V0h8v26h-8V16H8v10H0z" fill="currentColor" />
        <circle cx="14" cy="13" r="0" fill="#a259ff" />
      </svg>
      <span>Hades</span>
      {sub && <small>{sub}</small>}
    </Link>
  );
}
