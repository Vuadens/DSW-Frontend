import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell, PasswordField } from './AuthShell';
import { DEMO_ACCOUNTS, useAuthStore } from '../../stores/authStore';
import { MODULOS_DEMO } from '../../lib/features';

export default function LoginPage() {
  const session = useAuthStore((s) => s.session);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (session) return <Navigate to="/app" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!identificador.trim() || !password) return setError('Ingresá tu email o DNI y tu contraseña.');
    setSending(true);
    const result = await login(identificador, password);
    setSending(false);
    if (result) return setError(result);
    navigate('/app');
  };

  return (
    <AuthShell title="Volvé a entrenar." text="Ingresá con tu cuenta para reservar, pagar y ver tu agenda.">
      <h1>Ingresar</h1>
      {aviso && <p className="lede" role="status">{aviso}</p>}
      <form onSubmit={submit} noValidate>
        <div className="fld">
          <label htmlFor="identificador">Email o DNI</label>
          <input
            id="identificador"
            type="text"
            autoComplete="username"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
          />
        </div>
        <PasswordField id="password" label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" />
        <p className="err" role="alert">
          {error}
        </p>
        <button type="submit" className="btn block" disabled={sending}>
          {sending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="lede">
        Cuentas de prueba:{' '}
        {DEMO_ACCOUNTS.map((demo, i) => (
          <span key={demo.email}>
            {i > 0 && ' · '}
            <button
              type="button"
              className="text-link"
              style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }}
              onClick={() => {
                setIdentificador(demo.email);
                setPassword(demo.password);
                setError('');
              }}
            >
              {demo.label}
            </button>
          </span>
        ))}
      </p>
      <p className="lede">
        {MODULOS_DEMO && (
          <>
            <Link to="/recuperar" className="text-link">
              Olvidé mi contraseña
            </Link>
            {' · '}
          </>
        )}
        <Link to="/registro" className="text-link">
          Crear cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
