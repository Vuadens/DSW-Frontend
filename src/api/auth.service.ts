import type { Role } from '../models';
import { httpClient } from './httpClient';

type RolDto = 'ADMINISTRADOR' | 'PROFESOR' | 'SOCIO';

interface LoginDto {
  token: string;
  usuario: { idUsuario: number; usuario: string | null; email: string; rol: RolDto; personaId: number };
}

interface PerfilDto {
  idUsuario: number;
  email: string;
  usuario: string | null;
  rol: RolDto;
  personaId: number;
  persona: { dni: string; nombre: string; apellido: string; telefono: string; fechaNac: string };
}

export interface Perfil {
  role: Role;
  personaId: number;
  email: string;
  dni: string;
  nombre: string;
  apellido: string;
}

const ROLES: Record<RolDto, Role> = { ADMINISTRADOR: 'admin', PROFESOR: 'profesor', SOCIO: 'socio' };

export const authService = {
  /** El identificador es el email o el DNI. */
  login: async (identificador: string, password: string) =>
    (await httpClient.post<LoginDto>('/auth/login', { identificador, password })).data.token,

  me: async (): Promise<Perfil> => {
    const { data } = await httpClient.get<PerfilDto>('/auth/me');
    return {
      role: ROLES[data.rol],
      personaId: data.personaId,
      email: data.email,
      dni: data.persona.dni,
      nombre: data.persona.nombre,
      apellido: data.persona.apellido,
    };
  },
};
