import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import type { Role } from '../models';
import { useAuthStore } from '../stores/authStore';
import { MODULOS_DEMO } from '../lib/features';

const Landing = lazy(() => import('../pages/LandingPage'));
const Login = lazy(() => import('../pages/auth/LoginPage'));
const Register = lazy(() => import('../pages/auth/RegisterPage'));
const Recover = lazy(() => import('../pages/auth/RecoverPage'));
const CambiarPassword = lazy(() => import('../pages/auth/CambiarPasswordPage'));
const Perfil = lazy(() => import('../pages/PerfilPage'));

const AdminHome = lazy(() => import('../pages/admin/AdminHome'));
const Socios = lazy(() => import('../pages/admin/SociosPage'));
const Profesores = lazy(() => import('../pages/admin/ProfesoresPage'));
const Planes = lazy(() => import('../pages/admin/PlanesPage'));
const Finanzas = lazy(() => import('../pages/admin/FinanzasPage'));
const CuotasAdmin = lazy(() => import('../pages/admin/CuotasAdminPage'));
const Actividades = lazy(() => import('../pages/admin/ActividadesPage'));
const ClasesAdmin = lazy(() => import('../pages/admin/ClasesAdminPage'));
const Maquinas = lazy(() => import('../pages/admin/MaquinasPage'));
const Turnos = lazy(() => import('../pages/admin/TurnosPage'));
const Materiales = lazy(() => import('../pages/admin/MaterialesPage'));

const ProfesorHome = lazy(() => import('../pages/profesor/ProfesorHome'));
const SociosPorPlan = lazy(() => import('../pages/profesor/SociosPorPlanPage'));

const SocioHome = lazy(() => import('../pages/socio/SocioHome'));
const Reservar = lazy(() => import('../pages/socio/ReservarPage'));
const MisReservas = lazy(() => import('../pages/socio/MisReservasPage'));
const MisCuotas = lazy(() => import('../pages/socio/MisCuotasPage'));

/** Módulo sin backend todavía: en modo conectado redirige al inicio. */
const demo = (element: ReactNode) => (MODULOS_DEMO ? element : <Navigate to="/app" replace />);

function ByRole({ admin, profesor, socio }: Partial<Record<Role, ReactNode>>) {
  const role = useAuthStore((s) => s.session?.role);
  const content = role === 'admin' ? admin : role === 'profesor' ? profesor : socio;
  return <>{content ?? <Navigate to="/app" replace />}</>;
}

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<p className="none" role="status">Cargando…</p>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ingresar" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/recuperar" element={MODULOS_DEMO ? <Recover /> : <Navigate to="/ingresar" replace />} />
        <Route path="/cambiar-password" element={<CambiarPassword />} />
        <Route path="/app" element={<Shell />}>
          <Route index element={<ByRole admin={<AdminHome />} profesor={<ProfesorHome />} socio={<SocioHome />} />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="socios" element={<ByRole admin={<Socios />} profesor={<SociosPorPlan />} />} />
          <Route path="profesores" element={<ByRole admin={<Profesores />} />} />
          <Route path="planes" element={<ByRole admin={<Planes />} />} />
          <Route path="actividades" element={<ByRole admin={<Actividades />} />} />
          <Route path="maquinas" element={demo(<ByRole admin={<Maquinas />} />)} />
          <Route path="turnos" element={<ByRole admin={<Turnos />} />} />
          <Route path="materiales" element={demo(<ByRole admin={<Materiales />} />)} />
          <Route path="cuotas" element={<ByRole admin={<CuotasAdmin />} socio={<MisCuotas />} />} />
          <Route path="finanzas" element={demo(<ByRole admin={<Finanzas />} />)} />
          <Route path="clases" element={<ByRole admin={<ClasesAdmin />} socio={<Reservar />} />} />
          <Route path="reservas" element={<ByRole socio={<MisReservas />} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
