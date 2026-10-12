import type { Actividad } from '../models';
import { httpClient } from './httpClient';

interface ActividadDto {
  idActividad?: number;
  id?: number;
  nombre: string;
  descripcion?: string | null;
}

const fromDto = (dto: ActividadDto): Actividad => ({
  id: dto.idActividad ?? dto.id ?? 0,
  nombre: dto.nombre,
  descripcion: dto.descripcion ?? '',
  materiales: [],
  maquinas: [],
  tipo: 'Clase',
  planes: [],
  profesores: [],
});

export const actividadesService = {
  list: async () => (await httpClient.get<ActividadDto[]>('/actividades')).data.map(fromDto),
  create: async (actividad: Omit<Actividad, 'id'>) => fromDto((await httpClient.post<ActividadDto>('/actividades', {
    nombre: actividad.nombre,
    descripcion: actividad.descripcion || undefined,
    cupoMaximo: 20,
  })).data),
  update: async (id: number, actividad: Omit<Actividad, 'id'>) => fromDto((await httpClient.put<ActividadDto>(`/actividades/${id}`, {
    nombre: actividad.nombre,
    descripcion: actividad.descripcion || undefined,
    cupoMaximo: 20,
  })).data),
  remove: async (id: number) => { await httpClient.delete(`/actividades/${id}`); },
};
