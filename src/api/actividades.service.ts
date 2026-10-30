import type { Actividad } from '../models';
import { httpClient } from './httpClient';
import { maquinasService } from './maquinas.service';

interface ActividadDto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  cupoMaximo: number;
  planes: { idPlan: number }[];
  maquinas: { idMaquina: number }[];
}

type ActividadInput = Omit<Actividad, 'id'>;

/** Tipo, materiales y profesores no existen en el backend: se usan solo en modo demo. */
const fromDto = (dto: ActividadDto): Actividad => ({
  id: dto.id,
  nombre: dto.nombre,
  descripcion: dto.descripcion ?? '',
  cupoMaximo: dto.cupoMaximo,
  planes: dto.planes.map((p) => p.idPlan),
  tipo: 'Clase',
  materiales: [],
  maquinas: dto.maquinas.map((m) => m.idMaquina),
  profesores: [],
});

const toDto = (actividad: ActividadInput) => ({
  nombre: actividad.nombre,
  descripcion: actividad.descripcion || undefined,
  cupoMaximo: actividad.cupoMaximo,
  planes: actividad.planes,
});

/** Vincula y desvincula máquinas hasta que la actividad quede con las indicadas. */
const sincronizarMaquinas = async (idActividad: number, actuales: number[], deseadas: number[]) => {
  await Promise.all([
    ...deseadas.filter((m) => !actuales.includes(m)).map((m) => maquinasService.vincularActividad(m, idActividad)),
    ...actuales.filter((m) => !deseadas.includes(m)).map((m) => maquinasService.desvincularActividad(m, idActividad)),
  ]);
  return deseadas;
};

export const actividadesService = {
  list: async () => (await httpClient.get<ActividadDto[]>('/actividades')).data.map(fromDto),
  create: async (actividad: ActividadInput) => {
    const creada = fromDto((await httpClient.post<ActividadDto>('/actividades', toDto(actividad))).data);
    return { ...creada, maquinas: await sincronizarMaquinas(creada.id, [], actividad.maquinas) };
  },
  update: async (id: number, actividad: ActividadInput) => {
    const actualizada = fromDto((await httpClient.patch<ActividadDto>(`/actividades/${id}`, toDto(actividad))).data);
    return { ...actualizada, maquinas: await sincronizarMaquinas(id, actualizada.maquinas, actividad.maquinas) };
  },
  remove: async (id: number) => {
    await httpClient.delete(`/actividades/${id}`);
  },
};
