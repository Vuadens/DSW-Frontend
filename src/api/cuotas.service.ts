import type { Cuota } from '../models';
import { finDeMes, isoLocal } from '../lib/format';
import { httpClient } from './httpClient';

interface CuotaDto {
  idCuota: number;
  mesAnio: string;
  fechaPago: string;
  valor: string | number;
  socioId: number;
}

/** En el backend solo existen las cuotas cobradas y no registran el método de pago. */
const fromDto = (dto: CuotaDto): Cuota => {
  const periodo = dto.mesAnio.slice(0, 7);
  return {
    id: dto.idCuota,
    nroComprobante: `#${dto.idCuota}`,
    idSocio: dto.socioId,
    periodo,
    // Prisma serializa Decimal como string.
    valor: Number(dto.valor),
    fechaVencimiento: finDeMes(periodo),
    // Es un instante, no una fecha: a la noche en Argentina en UTC ya es el día siguiente.
    fechaPago: isoLocal(new Date(dto.fechaPago)),
    metodoPago: null,
  };
};

export const cuotasService = {
  /** El admin recibe todas las cuotas; el socio, solo las propias. */
  list: async () => (await httpClient.get<CuotaDto[]>('/cuotas')).data.map(fromDto),
  registrarCobro: async (socioId: number, mes: string) =>
    fromDto((await httpClient.post<CuotaDto>('/cuotas', { socioId, mes })).data),
};
