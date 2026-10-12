import type { ReactNode } from 'react';
import type { Tone } from '../../models';

interface Props {
  tone?: Tone;
  mine?: boolean;
  flat?: boolean;
  className?: string;
  children: ReactNode;
}

export function Tile({ tone = 'orange', mine, flat, className = '', children }: Props) {
  const classes = ['t', `v-${tone}`, mine && 'mine', flat && 'flat', className].filter(Boolean).join(' ');
  return <article className={classes}>{children}</article>;
}

export function TileFooter({ ruled, children }: { ruled?: boolean; children: ReactNode }) {
  return <div className={`ft${ruled ? ' ruled' : ''}`}>{children}</div>;
}

export function Pill({ kind, children }: { kind?: 'ok' | 'mora'; children: ReactNode }) {
  return <em className={`pill${kind ? ` ${kind}` : ''}`}>{children}</em>;
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="top">
      <div>
        {eyebrow && <p className="lede" style={{ marginTop: 0, marginBottom: 8 }}>{eyebrow}</p>}
        <h2>{title}</h2>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions}
    </header>
  );
}
