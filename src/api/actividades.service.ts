import type { Actividad } from '../models';
import { httpClient } from './httpClient';

interface ActividadDto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  cupoMaximo: number;
  planes: { idPlan: number }[];
}

type ActividadInput = Omit<Actividad, 'id'>;

/** Tipo, materiales, máquinas y profesores no existen en el backend: se usan solo en modo demo. */
const fromDto = (dto: ActividadDto): Actividad => ({
  id: dto.id,
  nombre: dto.nombre,
  descripcion: dto.descripcion ?? '',
  cupoMaximo: dto.cupoMaximo,
  planes: dto.planes.map((p) => p.idPlan),
  tipo: 'Clase',
  materiales: [],
  maquinas: [],
  profesores: [],
});

const toDto = (actividad: ActividadInput) => ({
  nombre: actividad.nombre,
  descripcion: actividad.descripcion || undefined,
  cupoMaximo: actividad.cupoMaximo,
  planes: actividad.planes,
});

export const actividadesService = {
  list: async () => (await httpClient.get<ActividadDto[]>('/actividades')).data.map(fromDto),
  create: async (actividad: ActividadInput) =>
    fromDto((await httpClient.post<ActividadDto>('/actividades', toDto(actividad))).data),
  update: async (id: number, actividad: ActividadInput) =>
    fromDto((await httpClient.patch<ActividadDto>(`/actividades/${id}`, toDto(actividad))).data),
  remove: async (id: number) => {
    await httpClient.delete(`/actividades/${id}`);
  },
};
