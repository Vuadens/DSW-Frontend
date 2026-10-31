import type { Clase } from '../models';
import { diaFromApi, diaToApi, fullName, type DiaApi } from '../lib/format';
import { httpClient } from './httpClient';

interface ClaseDto {
  idClase: number;
  diaSemana: DiaApi;
  horaDesde: string;
  horaHasta: string;
  cupo: number;
  idActividad: number;
  idProfesor: number;
  /** Ocupación en la próxima fecha de la clase (solo en los GET). */
  inscriptos?: number;
}

interface ClaseDetalleDto extends ClaseDto {
  fecha: string;
  inscriptos: number;
  disponibles: number;
  actividad: { nombre: string; descripcion: string | null };
  profesor: { cargo: string; persona: { nombre: string; apellido: string } };
}

export interface ClaseDetalle {
  clase: Clase;
  /** Próxima fecha en la que se dicta. */
  fecha: string;
  inscriptos: number;
  disponibles: number;
  actividad: { nombre: string; descripcion: string };
  profesor: { nombre: string; cargo: string };
}

type ClaseInput = Omit<Clase, 'id'>;

const fromDto = (dto: ClaseDto): Clase => ({
  id: dto.idClase,
  idActividad: dto.idActividad,
  dia: diaFromApi(dto.diaSemana),
  desde: dto.horaDesde,
  hasta: dto.horaHasta,
  cupo: dto.cupo,
  idProfesor: dto.idProfesor,
  ocupadosBase: 0,
  inscriptos: dto.inscriptos ?? 0,
});

const toDto = (clase: ClaseInput) => ({
  diaSemana: diaToApi(clase.dia),
  horaDesde: clase.desde,
  horaHasta: clase.hasta,
  cupo: clase.cupo,
  idActividad: clase.idActividad,
  idProfesor: clase.idProfesor,
});

export const clasesService = {
  list: async () => (await httpClient.get<ClaseDto[]>('/clases')).data.map(fromDto),
  detalle: async (id: number): Promise<ClaseDetalle> => {
    const { data } = await httpClient.get<ClaseDetalleDto>(`/clases/${id}`);
    const { nombre, apellido } = data.profesor.persona;
    return {
      clase: fromDto(data),
      fecha: data.fecha,
      inscriptos: data.inscriptos,
      disponibles: data.disponibles,
      actividad: { nombre: data.actividad.nombre, descripcion: data.actividad.descripcion ?? '' },
      profesor: { nombre: fullName(nombre, apellido), cargo: data.profesor.cargo },
    };
  },
  create: async (clase: ClaseInput) => fromDto((await httpClient.post<ClaseDto>('/clases', toDto(clase))).data),
  update: async (id: number, clase: ClaseInput) =>
    fromDto((await httpClient.patch<ClaseDto>(`/clases/${id}`, toDto(clase))).data),
  remove: async (id: number) => {
    await httpClient.delete(`/clases/${id}`);
  },
};
