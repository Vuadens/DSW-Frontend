import type { Role } from '../models';
import { httpClient } from './httpClient';
import { personaToDto, type PersonaDto } from './socios.service';

type RolDto = 'ADMINISTRADOR' | 'PROFESOR' | 'SOCIO';

interface LoginDto {
  token: string;
  usuario: {
    idUsuario: number;
    usuario: string | null;
    email: string;
    rol: RolDto;
    personaId: number;
    debeCambiarPassword: boolean;
  };
}

interface PerfilDto {
  idUsuario: number;
  email: string;
  usuario: string | null;
  rol: RolDto;
  personaId: number;
  debeCambiarPassword: boolean;
  persona: { dni: string; nombre: string; apellido: string; telefono: string; fechaNac: string };
}

export interface Perfil {
  role: Role;
  personaId: number;
  email: string;
  dni: string;
  nombre: string;
  apellido: string;
  debeCambiarPassword: boolean;
}

export interface Registro extends PersonaDto {
  email: string;
  idPlan: number;
}

const ROLES: Record<RolDto, Role> = { ADMINISTRADOR: 'admin', PROFESOR: 'profesor', SOCIO: 'socio' };

export const authService = {
  /** El identificador es el email o el DNI. */
  login: async (identificador: string, password: string) =>
    (await httpClient.post<LoginDto>('/auth/login', { identificador, password })).data.token,

  /** La contraseña inicial la asigna el backend: los últimos 6 dígitos del DNI. */
  registrar: async ({ email, idPlan, ...persona }: Registro) => {
    await httpClient.post('/auth/registro', { ...personaToDto(persona), email, planId: idPlan });
  },

  /** Devuelve el token nuevo, que ya no está marcado con la contraseña inicial. */
  cambiarPassword: async (passwordActual: string, passwordNueva: string) =>
    (await httpClient.post<LoginDto>('/auth/cambiar-password', { passwordActual, passwordNueva })).data.token,

  me: async (): Promise<Perfil> => {
    const { data } = await httpClient.get<PerfilDto>('/auth/me');
    return {
      role: ROLES[data.rol],
      personaId: data.personaId,
      email: data.email,
      dni: data.persona.dni,
      nombre: data.persona.nombre,
      apellido: data.persona.apellido,
      debeCambiarPassword: data.debeCambiarPassword,
    };
  },
};
