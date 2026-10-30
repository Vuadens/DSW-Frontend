import type { EstadoMaquina, Maquina } from '../models';
import { httpClient } from './httpClient';

type EstadoMaquinaApi = 'DISPONIBLE' | 'REPARACION' | 'INHABILITADA';

interface MaquinaDto {
  idMaquina: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  estado: EstadoMaquinaApi;
}

type MaquinaInput = Omit<Maquina, 'id'>;

const ESTADOS: Record<EstadoMaquinaApi, EstadoMaquina> = { DISPONIBLE: 'ok', REPARACION: 'mant', INHABILITADA: 'out' };

/** El historial de mantenimientos todavía no existe en el backend: se conserva lo local. */
const fromDto = (dto: MaquinaDto, local?: Partial<Maquina>): Maquina => ({
  id: dto.idMaquina,
  nombre: dto.nombre,
  tipo: dto.tipo,
  descripcion: dto.descripcion ?? '',
  estado: ESTADOS[dto.estado],
  mantenimientos: local?.mantenimientos ?? [],
});

// El estado no se envía: el alta queda DISPONIBLE y los cambios de estado tienen sus propios endpoints.
const toDto = (maquina: MaquinaInput) => ({
  nombre: maquina.nombre,
  tipo: maquina.tipo,
  descripcion: maquina.descripcion || undefined,
});

export const maquinasService = {
  list: async () => (await httpClient.get<MaquinaDto[]>('/maquinas')).data.map((dto) => fromDto(dto)),
  create: async (maquina: MaquinaInput) =>
    fromDto((await httpClient.post<MaquinaDto>('/maquinas', toDto(maquina))).data, maquina),
  update: async (id: number, maquina: MaquinaInput) =>
    fromDto((await httpClient.patch<MaquinaDto>(`/maquinas/${id}`, toDto(maquina))).data, maquina),
  remove: async (id: number) => {
    await httpClient.delete(`/maquinas/${id}`);
  },
  vincularActividad: async (idMaquina: number, idActividad: number) => {
    await httpClient.post(`/maquinas/${idMaquina}/actividades`, { idActividad });
  },
  desvincularActividad: async (idMaquina: number, idActividad: number) => {
    await httpClient.delete(`/maquinas/${idMaquina}/actividades/${idActividad}`);
  },
};
