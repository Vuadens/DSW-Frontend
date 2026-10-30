import { create } from 'zustand';
import { photosService } from '../api/photos.service';
import { API_ENABLED, apiErrorMessage, getAuthToken, onUnauthorized, setAuthToken } from '../api/httpClient';
import { authService, type Perfil } from '../api/auth.service';
import { mailerService } from '../api/mailer.service';
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
  passwords: Record<string, string>;
  photos: Record<string, string>;
  /** El identificador es el email o el DNI. */
  login: (identificador: string, password: string) => Promise<string | null>;
  restore: () => Promise<void>;
  register: (input: {
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    password: string;
  }) => Promise<string | null>;
  logout: () => void;
  requestReset: (email: string) => Promise<void>;
  resetPassword: (role: Role, email: string, password: string) => Promise<string | null>;
  setPhoto: (blob: Blob) => Promise<string | null>;
  removePhoto: () => Promise<void>;
}

const findAccount = (role: Role, email: string) => {
  const data = useDataStore.getState();
  const list = role === 'admin' ? data.administradores : role === 'profesor' ? data.profesores : data.socios;
  return list.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
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
  passwords: DEMO_PASSWORDS,
  photos: {},

  login: async (identificador, password) => {
    if (API_ENABLED) {
      try {
        setAuthToken(await authService.login(identificador.trim(), password));
        const perfil = await authService.me();
        set({ perfil, session: { role: perfil.role, userId: perfil.personaId } });
        return null;
      } catch (error) {
        setAuthToken(null);
        return apiErrorMessage(error, 'No pudimos iniciar sesión.');
      }
    }
    const account = findDemoAccount(identificador);
    const stored = account ? get().passwords[key(account.role, account.user.id)] : undefined;
    if (!account || !stored || stored !== password) return 'Email, DNI o contraseña incorrectos.';
    if (account.role === 'socio' && 'fechaBaja' in account.user && account.user.fechaBaja) {
      return 'Tu cuenta fue dada de baja.';
    }
    set({ session: { role: account.role, userId: account.user.id } });
    return null;
  },

  restore: async () => {
    if (!API_ENABLED || !getAuthToken()) return set({ restoring: false });
    try {
      const perfil = await authService.me();
      set({ perfil, session: { role: perfil.role, userId: perfil.personaId }, restoring: false });
    } catch {
      setAuthToken(null);
      set({ perfil: null, session: null, restoring: false });
    }
  },

  register: async (input) => {
    const data = useDataStore.getState();
    if (data.socios.some((s) => s.email.toLowerCase() === input.email.trim().toLowerCase())) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if (data.socios.some((s) => s.dni === input.dni.trim())) return 'Ya existe una cuenta con ese DNI.';
    const result = await data.save('socios', {
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      dni: input.dni.trim(),
      email: input.email.trim(),
      telefono: '',
      direccion: '',
      fechaNac: '',
      fechaAlta: '2026-10-11',
      fechaBaja: '',
      idPlan: null,
    });
    if (result.error) return result.error;
    const created = useDataStore.getState().socios.find((s) => s.email === input.email.trim());
    if (!created) return 'No pudimos crear la cuenta.';
    set((state) => ({
      passwords: { ...state.passwords, [key('socio', created.id)]: input.password },
      session: { role: 'socio', userId: created.id },
    }));
    return null;
  },

  logout: () => {
    setAuthToken(null);
    set({ session: null, perfil: null });
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
onUnauthorized(() => useAuthStore.setState({ session: null, perfil: null }));

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
      ? { role: 'profesor', id: p.id, nombre: p.nombre, apellido: p.apellido, email: p.email, detalle: p.cargo }
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
    email: s.email,
    detalle: plan ? plan.nombre : 'Sin plan',
  };
};
