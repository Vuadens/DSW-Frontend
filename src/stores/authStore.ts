import { create } from 'zustand';
import { photosService } from '../api/photos.service';
import { API_ENABLED, apiErrorMessage, getAuthToken, onUnauthorized, setAuthToken } from '../api/httpClient';
import { authService, type Perfil, type Registro } from '../api/auth.service';
import { mailerService } from '../api/mailer.service';
import { TODAY } from '../lib/format';
import type { Role } from '../models';
import { useDataStore } from './dataStore';

export interface Session {
  role: Role;
  userId: number;
}

export interface CurrentUser {
  role: Role;
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  detalle: string;
}

const key = (role: Role, id: number) => `${role}:${id}`;

/** Modo demo: igual que en el backend, las cuentas nuevas nacen con los últimos 6 dígitos del DNI. */
const passwordInicial = (dni: string) => dni.slice(-6);

const DEMO_PASSWORDS: Record<string, string> = {
  'admin:1': 'admin123',
  'profesor:1': 'profe123',
  'socio:1': 'socio123',
};

/** En modo conectado son las cuentas del seed del backend (DEMO_PASSWORD por defecto); el admin usa ADMIN_PASSWORD. */
export const DEMO_ACCOUNTS: { label: string; email: string; password: string }[] = API_ENABLED
  ? [
      { label: 'Profesor', email: 'marcos.benitez@hadesgym.com', password: 'demo1234' },
      { label: 'Socio', email: 'lucas.fernandez@gmail.com', password: 'demo1234' },
    ]
  : [
      { label: 'Administrador', email: 'admin@hadesgym.com', password: 'admin123' },
      { label: 'Profesor', email: 'marcos.benitez@hadesgym.com', password: 'profe123' },
      { label: 'Socio', email: 'lucas.fernandez@gmail.com', password: 'socio123' },
    ];

interface AuthState {
  session: Session | null;
  /** Usuario de /auth/me, solo en modo conectado. */
  perfil: Perfil | null;
  /** true mientras se recupera la sesión desde el token guardado. */
  restoring: boolean;
  /** Tiene la contraseña inicial: no puede operar hasta cambiarla. */
  debeCambiarPassword: boolean;
  passwords: Record<string, string>;
  photos: Record<string, string>;
  /** El identificador es el email o el DNI. */
  login: (identificador: string, password: string) => Promise<string | null>;
  restore: () => Promise<void>;
  register: (input: Registro) => Promise<string | null>;
  cambiarPassword: (actual: string, nueva: string) => Promise<string | null>;
  logout: () => void;
  requestReset: (email: string) => Promise<void>;
  resetPassword: (role: Role, email: string, password: string) => Promise<string | null>;
  setPhoto: (blob: Blob) => Promise<string | null>;
  removePhoto: () => Promise<void>;
}

const findAccount = (role: Role, email: string) => {
  const data = useDataStore.getState();
  const list = role === 'admin' ? data.administradores : role === 'profesor' ? data.profesores : data.socios;
  return list.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
};

/** Modo demo: busca la cuenta por email en los tres roles, o por DNI entre los socios. */
const findDemoAccount = (identificador: string) => {
  const value = identificador.trim().toLowerCase();
  for (const role of ['admin', 'profesor', 'socio'] as Role[]) {
    const user = findAccount(role, value);
    if (user) return { role, user };
  }
  const socio = useDataStore.getState().socios.find((s) => s.dni === value);
  return socio ? { role: 'socio' as Role, user: socio } : undefined;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  perfil: null,
  restoring: API_ENABLED && Boolean(getAuthToken()),
  debeCambiarPassword: false,
  passwords: DEMO_PASSWORDS,
  photos: {},

  login: async (identificador, password) => {
    if (API_ENABLED) {
      try {
        setAuthToken(await authService.login(identificador.trim(), password));
        const perfil = await authService.me();
        set({
          perfil,
          session: { role: perfil.role, userId: perfil.personaId },
          debeCambiarPassword: perfil.debeCambiarPassword,
        });
        return null;
      } catch (error) {
        setAuthToken(null);
        return apiErrorMessage(error, 'No pudimos iniciar sesión.');
      }
    }
    const account = findDemoAccount(identificador);
    const stored = account ? get().passwords[key(account.role, account.user.id)] : undefined;
    const esperada = stored ?? (account && 'dni' in account.user ? passwordInicial(account.user.dni) : undefined);
    if (!account || !esperada || esperada !== password) return 'Email, DNI o contraseña incorrectos.';
    if (account.role === 'socio' && 'fechaBaja' in account.user && account.user.fechaBaja) {
      return 'Tu cuenta fue dada de baja.';
    }
    set({ session: { role: account.role, userId: account.user.id }, debeCambiarPassword: !stored });
    return null;
  },

  restore: async () => {
    if (!API_ENABLED || !getAuthToken()) return set({ restoring: false });
    try {
      const perfil = await authService.me();
      set({
        perfil,
        session: { role: perfil.role, userId: perfil.personaId },
        debeCambiarPassword: perfil.debeCambiarPassword,
        restoring: false,
      });
    } catch {
      setAuthToken(null);
      set({ perfil: null, session: null, restoring: false });
    }
  },

  register: async (input) => {
    if (API_ENABLED) {
      try {
        await authService.registrar(input);
        return null;
      } catch (error) {
        return apiErrorMessage(error, 'No pudimos crear la cuenta.');
      }
    }
    const data = useDataStore.getState();
    if (data.socios.some((s) => s.email?.toLowerCase() === input.email.trim().toLowerCase())) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if (data.socios.some((s) => s.dni === input.dni.trim())) return 'Ya existe una cuenta con ese DNI.';
    const result = await data.save('socios', { ...input, fechaAlta: TODAY, fechaBaja: '' });
    return result.error ?? null;
  },

  cambiarPassword: async (actual, nueva) => {
    if (API_ENABLED) {
      try {
        setAuthToken(await authService.cambiarPassword(actual, nueva));
        set({ debeCambiarPassword: false });
        return null;
      } catch (error) {
        return apiErrorMessage(error, 'No pudimos cambiar la contraseña.');
      }
    }
    const { session, passwords } = get();
    if (!session) return 'Sesión expirada.';
    const socio = useDataStore.getState().socios.find((s) => s.id === session.userId);
    const profesor = useDataStore.getState().profesores.find((p) => p.id === session.userId);
    const dni = session.role === 'socio' ? socio?.dni : profesor?.dni;
    const esperada = passwords[key(session.role, session.userId)] ?? (dni && passwordInicial(dni));
    if (actual !== esperada) return 'La contraseña actual es incorrecta';
    set({
      passwords: { ...passwords, [key(session.role, session.userId)]: nueva },
      debeCambiarPassword: false,
    });
    return null;
  },

  logout: () => {
    setAuthToken(null);
    set({ session: null, perfil: null, debeCambiarPassword: false });
  },

  requestReset: async (email) => {
    await mailerService.sendReset(email);
  },

  resetPassword: async (role, email, password) => {
    const user = findAccount(role, email);
    try {
      await mailerService.resetPassword(email, password);
    } catch (error) {
      return apiErrorMessage(error);
    }
    if (!user) return null;
    set((state) => ({ passwords: { ...state.passwords, [key(role, user.id)]: password } }));
    return null;
  },

  setPhoto: async (blob) => {
    const { session } = get();
    if (!session) return 'Sesión expirada.';
    try {
      const url = await photosService.upload(session.role, session.userId, blob);
      set((state) => ({ photos: { ...state.photos, [key(session.role, session.userId)]: url } }));
      return null;
    } catch (error) {
      return apiErrorMessage(error, 'No pudimos subir la foto.');
    }
  },

  removePhoto: async () => {
    const { session } = get();
    if (!session) return;
    await photosService.remove(session.role, session.userId);
    set((state) => {
      const photos = { ...state.photos };
      delete photos[key(session.role, session.userId)];
      return { photos };
    });
  },
}));

// Token vencido o inválido: se cierra la sesión.
onUnauthorized(() => useAuthStore.setState({ session: null, perfil: null, debeCambiarPassword: false }));

export const photoKey = key;

export const useCurrentUser = (): CurrentUser | null => {
  const session = useAuthStore((s) => s.session);
  const perfil = useAuthStore((s) => s.perfil);
  const data = useDataStore();
  if (!session) return null;
  if (API_ENABLED) {
    if (!perfil) return null;
    const { role, personaId, nombre, apellido, email } = perfil;
    const profesor = data.profesores.find((p) => p.id === personaId);
    const plan = data.planes.find((p) => p.id === data.socios.find((s) => s.id === personaId)?.idPlan);
    const detalle =
      role === 'admin' ? 'Administrador' : role === 'profesor' ? profesor?.cargo ?? 'Profesor' : plan?.nombre ?? 'Sin plan';
    return { role, id: personaId, nombre, apellido, email, detalle };
  }
  if (session.role === 'admin') {
    const a = data.administradores.find((x) => x.id === session.userId);
    return a ? { role: 'admin', ...a, detalle: 'Administrador' } : null;
  }
  if (session.role === 'profesor') {
    const p = data.profesores.find((x) => x.id === session.userId);
    return p
      ? { role: 'profesor', id: p.id, nombre: p.nombre, apellido: p.apellido, email: p.email ?? '', detalle: p.cargo }
      : null;
  }
  const s = data.socios.find((x) => x.id === session.userId);
  if (!s) return null;
  const plan = data.planes.find((p) => p.id === s.idPlan);
  return {
    role: 'socio',
    id: s.id,
    nombre: s.nombre,
    apellido: s.apellido,
    email: s.email ?? '',
    detalle: plan ? plan.nombre : 'Sin plan',
  };
};
