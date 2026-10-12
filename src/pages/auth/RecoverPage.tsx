import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell, PasswordField } from './AuthShell';
import { useAuthStore } from '../../stores/authStore';
import type { Role } from '../../models';

const ROLES: { id: Role; label: string }[] = [
  { id: 'socio', label: 'Socio' },
  { id: 'profesor', label: 'Profesor' },
  { id: 'admin', label: 'Administrador' },
];

export default function RecoverPage() {
  const requestReset = useAuthStore((s) => s.requestReset);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [step, setStep] = useState<'email' | 'password' | 'done'>('email');
  const [role, setRole] = useState<Role>('socio');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Ingresá un correo válido.');
    setBusy(true);
    await requestReset(email.trim());
    setBusy(false);
    setError('');
    setStep('password');
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setBusy(true);
    const result = await resetPassword(role, email.trim(), password);
    setBusy(false);
    if (result) return setError(result);
    setError('');
    setStep('done');
  };

  return (
    <AuthShell title="Recuperá tu acceso." text="Te enviamos un correo para que definas una nueva contraseña.">
      <h1>Recuperar contraseña</h1>
      {step === 'email' && (
        <form onSubmit={sendEmail} noValidate>
          <div className="seg" role="radiogroup" aria-label="Tipo de cuenta">
            {ROLES.map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={role === r.id} onClick={() => setRole(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="fld">
            <label htmlFor="rec-email">Correo electrónico</label>
            <input id="rec-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <p className="err" role="alert">
            {error}
          </p>
          <button type="submit" className="btn block" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar correo'}
          </button>
        </form>
      )}
      {step === 'password' && (
        <form onSubmit={savePassword} noValidate>
          <p className="lede">Si el correo existe, recibirás un mensaje. Elegí ahora tu nueva contraseña.</p>
          <PasswordField id="rec-password" label="Nueva contraseña" value={password} onChange={setPassword} autoComplete="new-password" />
          <p className="err" role="alert">
            {error}
          </p>
          <button type="submit" className="btn block" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
      {step === 'done' && <p className="lede">Listo, tu contraseña fue actualizada.</p>}
      <p className="lede">
        <Link to="/ingresar" className="text-link">
          Volver a ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
