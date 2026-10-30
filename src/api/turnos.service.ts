import type { Turno } from '../models';
import { diaFromApi, diaToApi, type DiaApi } from '../lib/format';
import { httpClient } from './httpClient';

interface TurnoDto {
  idTurno: number;
  nombre: string | null;
  diaSemana: DiaApi;
  horaDesde: string;
  horaHasta: string;
}

type TurnoInput = Omit<Turno, 'id'>;

const fromDto = (dto: TurnoDto): Turno => ({
  id: dto.idTurno,
  nombre: dto.nombre ?? '',
  dia: diaFromApi(dto.diaSemana),
  desde: dto.horaDesde,
  hasta: dto.horaHasta,
});

const toDto = (turno: TurnoInput) => ({
  nombre: turno.nombre || undefined,
  diaSemana: diaToApi(turno.dia),
  horaDesde: turno.desde,
  horaHasta: turno.hasta,
});

export const turnosService = {
  list: async () => (await httpClient.get<TurnoDto[]>('/turnos')).data.map(fromDto),
  create: async (turno: TurnoInput) => fromDto((await httpClient.post<TurnoDto>('/turnos', toDto(turno))).data),
  update: async (id: number, turno: TurnoInput) =>
    fromDto((await httpClient.patch<TurnoDto>(`/turnos/${id}`, toDto(turno))).data),
  remove: async (id: number) => {
    await httpClient.delete(`/turnos/${id}`);
  },
  asignarProfesor: async (idTurno: number, idProfesor: number) => {
    await httpClient.post(`/turnos/${idTurno}/profesores`, { idProfesor });
  },
  desasignarProfesor: async (idTurno: number, idProfesor: number) => {
    await httpClient.delete(`/turnos/${idTurno}/profesores/${idProfesor}`);
  },
};
