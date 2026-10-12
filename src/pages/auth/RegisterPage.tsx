import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthShell, PasswordField } from './AuthShell';
import { useAuthStore } from '../../stores/authStore';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const session = useAuthStore((s) => s.session);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/app" replace />;

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    if (!form.nombre.trim() || !form.apellido.trim()) return 'Completá tu nombre y apellido.';
    if (!/^\d{7,9}$/.test(form.dni.trim())) return 'El DNI debe tener entre 7 y 9 números.';
    if (!EMAIL.test(form.email.trim())) return 'Ingresá un correo válido.';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return '';
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validate();
    if (invalid) return setError(invalid);
    setBusy(true);
    const result = await register(form);
    setBusy(false);
    if (result) return setError(result);
    navigate('/app');
  };

  return (
    <AuthShell title="Sumate a Hades." text="Creá tu cuenta de socio y empezá a reservar clases hoy.">
      <h1>Crear cuenta</h1>
      <form onSubmit={submit} noValidate>
        <div className="fld">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" autoComplete="given-name" value={form.nombre} onChange={(e) => set('nombre')(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="apellido">Apellido</label>
          <input id="apellido" autoComplete="family-name" value={form.apellido} onChange={(e) => set('apellido')(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="dni">DNI</label>
          <input id="dni" inputMode="numeric" value={form.dni} onChange={(e) => set('dni')(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="reg-email">Correo electrónico</label>
          <input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} />
        </div>
        <PasswordField id="reg-password" label="Contraseña" value={form.password} onChange={set('password')} autoComplete="new-password" />
        <p className="err" role="alert">
          {error}
        </p>
        <button type="submit" className="btn block" disabled={busy}>
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="lede">
        ¿Ya tenés cuenta?{' '}
        <Link to="/ingresar" className="text-link">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
