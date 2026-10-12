import { useState, type ReactNode } from 'react';
import { Logo } from '../../components/common/Logo';
import { Tile } from '../../components/common/Tile';

export function AuthShell({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="lgp">
      <Tile tone="blue" flat className="auth-visual">
        <Logo />
        <h2>{title}</h2>
        <p>{text}</p>
      </Tile>
      <main className="lf">{children}</main>
    </div>
  );
}

interface PasswordProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}

export function PasswordField({ id, label, value, onChange, autoComplete }: PasswordProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-pressed={visible}>
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  );
}
