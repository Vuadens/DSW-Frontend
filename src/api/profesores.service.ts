import type { Profesor } from '../models';
import { httpClient } from './httpClient';

interface ProfesorDto {
  idProfesor: number;
  nombre: string;
  apellido: string;
  cargo: string;
}

type ProfesorInput = Omit<Profesor, 'id'>;

/** Los campos que el backend aún no tiene (turno, supervisor, sueldos) se completan con lo local. */
const fromDto = (dto: ProfesorDto, local?: Partial<Profesor>): Profesor => ({
  id: dto.idProfesor,
  nombre: dto.nombre,
  apellido: dto.apellido,
  cargo: dto.cargo,
  email: local?.email ?? '',
  telefono: local?.telefono ?? '',
  idTurno: local?.idTurno ?? null,
  idSupervisor: local?.idSupervisor ?? null,
  sueldos: local?.sueldos ?? [],
});

const toDto = ({ nombre, apellido, cargo }: ProfesorInput) => ({ nombre, apellido, cargo });

export const profesoresService = {
  list: async () => (await httpClient.get<ProfesorDto[]>('/profesores')).data.map((dto) => fromDto(dto)),
  create: async (profesor: ProfesorInput) =>
    fromDto((await httpClient.post<ProfesorDto>('/profesores', toDto(profesor))).data, profesor),
  update: async (id: number, profesor: ProfesorInput) =>
    fromDto((await httpClient.put<ProfesorDto>(`/profesores/${id}`, toDto(profesor))).data, profesor),
  remove: async (id: number) => {
    await httpClient.delete(`/profesores/${id}`);
  },
};
