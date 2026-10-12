import { useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Avatar } from '../common/Avatar';
import { PhotoModal } from '../common/PhotoModal';
import { Toast } from '../common/Toast';
import { fullName } from '../../lib/format';
import { photoKey, useAuthStore, useCurrentUser } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import type { Role } from '../../models';

const NAV: Record<Role, { to: string; label: string; end?: boolean }[]> = {
  admin: [
    { to: '/app', label: 'Resumen', end: true },
    { to: '/app/socios', label: 'Socios' },
    { to: '/app/profesores', label: 'Profesores' },
    { to: '/app/planes', label: 'Planes' },
    { to: '/app/cuotas', label: 'Cuotas' },
    { to: '/app/actividades', label: 'Actividades' },
    { to: '/app/clases', label: 'Clases' },
    { to: '/app/maquinas', label: 'Máquinas' },
    { to: '/app/catalogos', label: 'Turnos y materiales' },
    { to: '/app/perfil', label: 'Mi perfil' },
  ],
  profesor: [
    { to: '/app', label: 'Mi agenda', end: true },
    { to: '/app/perfil', label: 'Mi perfil' },
  ],
  socio: [
    { to: '/app', label: 'Inicio', end: true },
    { to: '/app/clases', label: 'Reservar clase' },
    { to: '/app/reservas', label: 'Mis reservas' },
    { to: '/app/cuotas', label: 'Mis cuotas' },
    { to: '/app/perfil', label: 'Mi perfil' },
  ],
};

const ROLE_LABEL: Record<Role, string> = { admin: 'Administración', profesor: 'Profesores', socio: 'Socios' };
const THEME_LABEL = { system: 'Tema: automático', light: 'Tema: claro', dark: 'Tema: oscuro' };

export function Shell() {
  const user = useCurrentUser();
  const photos = useAuthStore((s) => s.photos);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const cycleTheme = useUiStore((s) => s.cycleTheme);
  const navigate = useNavigate();
  const [photoOpen, setPhotoOpen] = useState(false);

  if (!user) return <Navigate to="/ingresar" replace />;

  const photo = photos[photoKey(user.role, user.id)];
  const name = fullName(user.nombre, user.apellido);

  return (
    <div className="app">
      <aside className="side">
        <Logo sub={ROLE_LABEL[user.role]} to="/app" />
        <div className="me">
          <Avatar role={user.role} name={name} photo={photo} onClick={() => setPhotoOpen(true)} />
          <div>
            <b>{name}</b>
            <span>{user.detalle}</span>
          </div>
        </div>
        <nav className="snav" aria-label="Secciones">
          {NAV[user.role].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sf">
          <button type="button" onClick={cycleTheme}>
            {THEME_LABEL[theme]}
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="w">
          <Outlet />
        </div>
      </main>
      <PhotoModal open={photoOpen} hasPhoto={Boolean(photo)} onClose={() => setPhotoOpen(false)} />
      <Toast />
    </div>
  );
}
