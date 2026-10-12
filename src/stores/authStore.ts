import { create } from 'zustand';
import { photosService } from '../api/photos.service';
import { apiErrorMessage } from '../api/httpClient';
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

export const DEMO_ACCOUNTS: { role: Role; email: string; password: string }[] = [
  { role: 'admin', email: 'admin@hadesgym.com', password: 'admin123' },
  { role: 'profesor', email: 'marcos.benitez@hadesgym.com', password: 'profe123' },
  { role: 'socio', email: 'lucas.fernandez@gmail.com', password: 'socio123' },
];

interface AuthState {
  session: Session | null;
  passwords: Record<string, string>;
  photos: Record<string, string>;
  login: (role: Role, email: string, password: string) => string | null;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  passwords: DEMO_PASSWORDS,
  photos: {},

  login: (role, email, password) => {
    const user = findAccount(role, email);
    const stored = user ? get().passwords[key(role, user.id)] : undefined;
    if (!user || !stored || stored !== password) return 'Correo o contraseña incorrectos.';
    if (role === 'socio' && 'fechaBaja' in user && user.fechaBaja) return 'Tu cuenta fue dada de baja.';
    set({ session: { role, userId: user.id } });
    return null;
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

  logout: () => set({ session: null }),

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

export const photoKey = key;

export const useCurrentUser = (): CurrentUser | null => {
  const session = useAuthStore((s) => s.session);
  const data = useDataStore();
  if (!session) return null;
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
