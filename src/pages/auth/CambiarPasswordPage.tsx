import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthShell, PasswordField } from './AuthShell';
import { useAuthStore } from '../../stores/authStore';

export default function CambiarPasswordPage() {
  const session = useAuthStore((s) => s.session);
  const restoring = useAuthStore((s) => s.restoring);
  const debeCambiarPassword = useAuthStore((s) => s.debeCambiarPassword);
  const cambiarPassword = useAuthStore((s) => s.cambiarPassword);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (restoring) return <p className="none" role="status">Cargando…</p>;
  if (!session) return <Navigate to="/ingresar" replace />;
  if (!debeCambiarPassword) return <Navigate to="/app" replace />;

  const validate = () => {
    if (!actual) return 'Ingresá tu contraseña actual.';
    if (nueva.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (nueva === actual) return 'La contraseña nueva debe ser distinta de la actual.';
    if (nueva !== repetida) return 'Las contraseñas no coinciden.';
    return '';
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validate();
    if (invalid) return setError(invalid);
    setBusy(true);
    const result = await cambiarPassword(actual, nueva);
    setBusy(false);
    if (result) return setError(result);
    navigate('/app', { replace: true });
  };

  return (
    <AuthShell title="Elegí tu contraseña." text="Es tu primer ingreso: reemplazá la contraseña inicial por una personal.">
      <h1>Cambiar contraseña</h1>
      <p className="lede">Tu contraseña actual son los últimos 6 dígitos de tu DNI.</p>
      <form onSubmit={submit} noValidate>
        <PasswordField id="pw-actual" label="Contraseña actual" value={actual} onChange={setActual} autoComplete="current-password" />
        <PasswordField id="pw-nueva" label="Contraseña nueva" value={nueva} onChange={setNueva} autoComplete="new-password" />
        <PasswordField id="pw-repetida" label="Repetí la contraseña nueva" value={repetida} onChange={setRepetida} autoComplete="new-password" />
        <p className="err" role="alert">
          {error}
        </p>
        <button type="submit" className="btn block" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
      <p className="lede">
        <button
          type="button"
          className="text-link"
          style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }}
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          Cerrar sesión
        </button>
      </p>
    </AuthShell>
  );
}
