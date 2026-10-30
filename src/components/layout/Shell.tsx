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
import { MODULOS_DEMO } from '../../lib/features';

/** `demo`: el módulo todavía no tiene backend y solo se muestra en modo demo. */
const NAV: Record<Role, { to: string; label: string; end?: boolean; demo?: boolean }[]> = {
  admin: [
    { to: '/app', label: 'Mi panel', end: true },
    { to: '/app/socios', label: 'Socios' },
    { to: '/app/profesores', label: 'Profesores' },
    { to: '/app/planes', label: 'Planes', demo: true },
    { to: '/app/finanzas', label: 'Finanzas', demo: true },
    { to: '/app/actividades', label: 'Actividades' },
    { to: '/app/clases', label: 'Clases' },
    { to: '/app/maquinas', label: 'Máquinas', demo: true },
    { to: '/app/catalogos', label: MODULOS_DEMO ? 'Turnos y materiales' : 'Turnos' },
    { to: '/app/perfil', label: 'Actualizar mis datos' },
  ],
  profesor: [
    { to: '/app', label: MODULOS_DEMO ? 'Sueldo y proyección' : 'Mi agenda', end: true },
    { to: '/app/perfil', label: 'Actualizar mis datos' },
  ],
  socio: [
    { to: '/app', label: 'Inicio', end: true },
    { to: '/app/clases', label: 'Reservar clase' },
    { to: '/app/reservas', label: 'Mis reservas' },
    { to: '/app/cuotas', label: 'Mis cuotas', demo: true },
    { to: '/app/perfil', label: 'Actualizar mis datos' },
  ],
};

const ROLE_LABEL: Record<Role, string> = { admin: 'Administración', profesor: 'Profesores', socio: 'Socios' };
const THEME_LABEL = { system: 'Tema: automático', light: 'Tema: claro', dark: 'Tema: oscuro' };

export function Shell() {
  const user = useCurrentUser();
  const photos = useAuthStore((s) => s.photos);
  const logout = useAuthStore((s) => s.logout);
  const restoring = useAuthStore((s) => s.restoring);
  const theme = useUiStore((s) => s.theme);
  const cycleTheme = useUiStore((s) => s.cycleTheme);
  const navigate = useNavigate();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (restoring) return <p className="none" role="status">Cargando…</p>;
  if (!user) return <Navigate to="/ingresar" replace />;

  const photo = photos[photoKey(user.role, user.id)];
  const name = fullName(user.nombre, user.apellido);

  return (
    <div className={`app${collapsed ? ' menu-collapsed' : ''}`}>
      <aside className="side">
        <div className="side-top">
          <Logo sub={ROLE_LABEL[user.role]} to="/app" />
          <button type="button" className="menu-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'} aria-pressed={collapsed}>
            <span aria-hidden="true">{collapsed ? '☰' : '×'}</span>
          </button>
        </div>
        <div className="me">
          <Avatar role={user.role} name={name} photo={photo} onClick={MODULOS_DEMO ? () => setPhotoOpen(true) : undefined} />
          <div>
            <b>{name}</b>
            <span>{user.detalle}</span>
          </div>
        </div>
        <nav className="snav" aria-label="Secciones">
          {NAV[user.role].filter((item) => MODULOS_DEMO || !item.demo).map((item) => (
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
