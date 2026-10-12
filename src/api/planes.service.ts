import type { Plan, TipoPlan } from '../models';
import { httpClient } from './httpClient';

interface PlanDto {
  idPlan: number;
  nombre: string;
  tipo: TipoPlan | null;
  descripcion: string | null;
  precio: string | number;
  duracionMeses: number | null;
  activo: boolean;
}

type PlanInput = Omit<Plan, 'id'>;

const fromDto = (dto: PlanDto, local?: Partial<Plan>): Plan => ({
  id: dto.idPlan,
  nombre: dto.nombre,
  tipo: dto.tipo ?? 'ESTANDAR',
  descripcion: dto.descripcion ?? '',
  // Prisma serializa Decimal como string.
  precio: Number(dto.precio),
  // El backend todavía no modela clases por período; se conserva lo cargado en la UI.
  clasesPorPeriodo: local?.clasesPorPeriodo ?? null,
});

const toDto = (plan: PlanInput) => ({
  nombre: plan.nombre,
  tipo: plan.tipo,
  precio: plan.precio,
  descripcion: plan.descripcion || undefined,
});

export const planesService = {
  list: async () => (await httpClient.get<PlanDto[]>('/planes')).data.map((dto) => fromDto(dto)),
  create: async (plan: PlanInput) =>
    fromDto((await httpClient.post<PlanDto>('/planes', toDto(plan))).data, plan),
  update: async (id: number, plan: PlanInput) =>
    fromDto((await httpClient.patch<PlanDto>(`/planes/${id}`, toDto(plan))).data, plan),
  remove: async (id: number) => {
    await httpClient.delete(`/planes/${id}`);
  },
};
