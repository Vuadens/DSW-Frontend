import type { Socio } from '../models';
import { dateOnly } from '../lib/format';
import { httpClient } from './httpClient';

export interface PersonaDto {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  fechaNac: string;
}

interface SocioDto {
  idPersona: number;
  fechaAlta: string;
  fechaBaja: string | null;
  planId: number;
  persona: PersonaDto;
}

type SocioInput = Omit<Socio, 'id'>;

const fromDto = (dto: SocioDto): Socio => ({
  id: dto.idPersona,
  dni: dto.persona.dni,
  nombre: dto.persona.nombre,
  apellido: dto.persona.apellido,
  telefono: dto.persona.telefono,
  fechaNac: dateOnly(dto.persona.fechaNac),
  fechaAlta: dateOnly(dto.fechaAlta),
  fechaBaja: dateOnly(dto.fechaBaja),
  idPlan: dto.planId,
});

export const personaToDto = (persona: PersonaDto) => ({
  dni: persona.dni,
  nombre: persona.nombre,
  apellido: persona.apellido,
  telefono: persona.telefono,
  fechaNac: persona.fechaNac,
});

const toDto = (socio: SocioInput) => ({
  ...personaToDto(socio),
  planId: socio.idPlan ?? undefined,
  fechaAlta: socio.fechaAlta || undefined,
  fechaBaja: socio.fechaBaja || null,
});

export type EstadoCuotaSocio = 'AL_DIA' | 'ADEUDA';

interface SocioPorPlanDto {
  idPersona: number;
  persona: Pick<PersonaDto, 'dni' | 'nombre' | 'apellido'>;
  /** Solo para el administrador. */
  estadoCuota?: EstadoCuotaSocio;
}

export const sociosService = {
  list: async () => (await httpClient.get<SocioDto[]>('/socios')).data.map(fromDto),
  /** Listado de socios de un plan: nombre, apellido y DNI; el admin recibe además el estado de la cuota del mes. */
  porPlan: async (planId: number) =>
    (await httpClient.get<SocioPorPlanDto[]>('/socios', { params: { planId } })).data.map((dto) => ({
      id: dto.idPersona,
      ...dto.persona,
      estadoCuota: dto.estadoCuota,
    })),
  create: async (socio: SocioInput) => fromDto((await httpClient.post<SocioDto>('/socios', toDto(socio))).data),
  update: async (id: number, socio: SocioInput) =>
    fromDto((await httpClient.patch<SocioDto>(`/socios/${id}`, toDto(socio))).data),
  remove: async (id: number) => {
    await httpClient.delete(`/socios/${id}`);
  },
};
