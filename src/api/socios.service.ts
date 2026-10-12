import type { Socio } from '../models';
import { httpClient } from './httpClient';

interface SocioDto {
  idSocio: number;
  DNI: string;
  apellido: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_baja: string | null;
  fecha_nac: string;
}

type SocioInput = Omit<Socio, 'id'>;

const dateOnly = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/** El plan y la fecha de alta todavía no existen en el backend: se conservan los datos locales. */
const fromDto = (dto: SocioDto, local?: Partial<Socio>): Socio => ({
  id: dto.idSocio,
  dni: dto.DNI,
  nombre: dto.nombre,
  apellido: dto.apellido,
  email: dto.email,
  telefono: dto.telefono,
  direccion: dto.direccion,
  fechaNac: dateOnly(dto.fecha_nac),
  fechaBaja: dateOnly(dto.fecha_baja),
  fechaAlta: local?.fechaAlta ?? '',
  idPlan: local?.idPlan ?? null,
});

const toDto = (socio: SocioInput) => ({
  DNI: socio.dni,
  nombre: socio.nombre,
  apellido: socio.apellido,
  email: socio.email,
  telefono: socio.telefono,
  direccion: socio.direccion,
  fecha_nac: socio.fechaNac ? new Date(socio.fechaNac).toISOString() : new Date(0).toISOString(),
  fecha_baja: socio.fechaBaja ? new Date(socio.fechaBaja).toISOString() : null,
});

export const sociosService = {
  list: async () => (await httpClient.get<SocioDto[]>('/socios')).data.map((dto) => fromDto(dto)),
  create: async (socio: SocioInput) =>
    fromDto((await httpClient.post<SocioDto>('/socios', toDto(socio))).data, socio),
  update: async (id: number, socio: SocioInput) =>
    fromDto((await httpClient.put<SocioDto>(`/socios/${id}`, toDto(socio))).data, socio),
  remove: async (id: number) => {
    await httpClient.delete(`/socios/${id}`);
  },
};
