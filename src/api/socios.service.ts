import type { Cuota, Socio } from '../models';
import { dateOnly } from '../lib/format';
import { cuotaFromDto, type CuotaDto } from './cuotas.service';
import { httpClient } from './httpClient';

export interface PersonaDto {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  fechaNac: string;
  /** Cuenta de acceso de la persona; las altas viejas pueden no tenerla. */
  usuario?: { email: string } | null;
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
  email: dto.persona.usuario?.email,
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
  email: socio.email,
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

interface SocioDetalleDto extends SocioDto {
  plan: { nombre: string };
  cuotas: CuotaDto[];
  estadoCuotas: { estado: EstadoCuotaSocio; ultimoMesPagado: string | null };
}

export interface SocioDetalle {
  socio: Socio;
  plan: string;
  cuotas: Cuota[];
  estadoCuota: EstadoCuotaSocio;
  /** Período "2026-10". */
  ultimoMesPagado: string | null;
}

export const sociosService = {
  list: async () => (await httpClient.get<SocioDto[]>('/socios')).data.map(fromDto),
  detalle: async (id: number): Promise<SocioDetalle> => {
    const { data } = await httpClient.get<SocioDetalleDto>(`/socios/${id}`);
    return {
      socio: fromDto(data),
      plan: data.plan.nombre,
      cuotas: data.cuotas.map(cuotaFromDto),
      estadoCuota: data.estadoCuotas.estado,
      ultimoMesPagado: data.estadoCuotas.ultimoMesPagado?.slice(0, 7) ?? null,
    };
  },
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
