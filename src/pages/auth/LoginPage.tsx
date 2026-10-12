import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthShell, PasswordField } from './AuthShell';
import { DEMO_ACCOUNTS, useAuthStore } from '../../stores/authStore';
import type { Role } from '../../models';

const ROLES: { id: Role; label: string }[] = [
  { id: 'socio', label: 'Socio' },
  { id: 'profesor', label: 'Profesor' },
  { id: 'admin', label: 'Administrador' },
];

export default function LoginPage() {
  const session = useAuthStore((s) => s.session);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('socio');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (session) return <Navigate to="/app" replace />;

  const demo = DEMO_ACCOUNTS.find((a) => a.role === role);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = login(role, email.trim(), password);
    if (result) return setError(result);
    navigate('/app');
  };

  return (
    <AuthShell title="Volvé a entrenar." text="Ingresá con tu cuenta para reservar, pagar y ver tu agenda.">
      <h1>Ingresar</h1>
      <div className="seg" role="radiogroup" aria-label="Tipo de cuenta">
        {ROLES.map((r) => (
          <button key={r.id} type="button" role="radio" aria-checked={role === r.id} onClick={() => setRole(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} noValidate>
        <div className="fld">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <PasswordField id="password" label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" />
        <p className="err" role="alert">
          {error}
        </p>
        <button type="submit" className="btn block">
          Ingresar
        </button>
      </form>
      {demo && (
        <p className="lede">
          Cuenta de prueba:{' '}
          <button
            type="button"
            className="text-link"
            style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }}
            onClick={() => {
              setEmail(demo.email);
              setPassword(demo.password);
              setError('');
            }}
          >
            {demo.email}
          </button>
        </p>
      )}
      <p className="lede">
        <Link to="/recuperar" className="text-link">
          Olvidé mi contraseña
        </Link>
        {role === 'socio' && (
          <>
            {' · '}
            <Link to="/registro" className="text-link">
              Crear cuenta
            </Link>
          </>
        )}
      </p>
    </AuthShell>
  );
}
