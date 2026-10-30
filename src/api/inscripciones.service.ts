import type { Inscripcion } from '../models';
import { dateOnly } from '../lib/format';
import { httpClient } from './httpClient';

interface InscripcionDto {
  idInscripcion: number;
  idSocio: number;
  idClase: number;
  fechaClase: string;
  estado: 'CONFIRMADA' | 'CANCELADA';
  asistio: boolean;
}

const fromDto = (dto: InscripcionDto): Inscripcion => ({
  id: dto.idInscripcion,
  idSocio: dto.idSocio,
  idClase: dto.idClase,
  fechaClase: dateOnly(dto.fechaClase),
  estado: dto.estado === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada',
  asistio: dto.asistio,
});

export const inscripcionesService = {
  /** El socio recibe solo las propias. */
  list: async () => (await httpClient.get<InscripcionDto[]>('/inscripciones')).data.map(fromDto),
  reservar: async (idSocio: number, idClase: number, fechaClase: string) =>
    fromDto((await httpClient.post<InscripcionDto>('/inscripciones', { idSocio, idClase, fechaClase })).data),
  cancelar: async (id: number) => {
    await httpClient.patch(`/inscripciones/${id}/cancelar`);
  },
  asistencia: async (id: number, asistio: boolean) =>
    fromDto((await httpClient.patch<InscripcionDto>(`/inscripciones/${id}/asistencia`, { asistio })).data),
  remove: async (id: number) => {
    await httpClient.delete(`/inscripciones/${id}`);
  },
};
