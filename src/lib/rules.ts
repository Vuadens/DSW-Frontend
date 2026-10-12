import type { Actividad, Clase, Cuota, EstadoCuota, EstadoMaquina, Inscripcion, Plan, Socio } from '../models';
import { ADICIONAL_CLASES, PERIODO_ACTUAL, TODAY, claseFecha } from './format';

export const estadoCuota = (cuota: Cuota): EstadoCuota => {
  if (cuota.fechaPago) return 'pagada';
  return cuota.fechaVencimiento < TODAY ? 'vencida' : 'pendiente';
};

export const ESTADO_CUOTA_LABEL: Record<EstadoCuota, string> = {
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  vencida: 'En mora',
};

export const ESTADO_MAQUINA_LABEL: Record<EstadoMaquina, string> = {
  ok: 'Operativa',
  mant: 'En mantenimiento',
  out: 'Fuera de servicio',
};

export const periodoLabel = (periodo: string) => {
  const [y, m] = periodo.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[Number(m) - 1]} ${y}`;
};

export const ocupados = (clase: Clase, inscripciones: Inscripcion[]) =>
  clase.ocupadosBase +
  inscripciones.filter(
    (i) => i.idClase === clase.id && i.estado === 'Confirmada' && i.fechaClase === claseFecha(clase.dia),
  ).length;

export const estaInscripto = (socioId: number, clase: Clase, inscripciones: Inscripcion[]) =>
  inscripciones.some(
    (i) =>
      i.idSocio === socioId &&
      i.idClase === clase.id &&
      i.estado === 'Confirmada' &&
      i.fechaClase === claseFecha(clase.dia),
  );

export const clasesDelPeriodo = (socioId: number, inscripciones: Inscripcion[]) =>
  inscripciones.filter(
    (i) => i.idSocio === socioId && i.estado === 'Confirmada' && i.fechaClase.startsWith(PERIODO_ACTUAL),
  ).length;

export const adicionalPorClase = (plan: Plan | undefined) => (plan ? Math.round(plan.precio * ADICIONAL_CLASES) : 0);

export interface Elegibilidad {
  permitido: boolean;
  motivo?: string;
  adicional: number;
}

/** Reglas de inscripción: plan habilitado, sin mora, cupo y tope de clases del período. */
export const puedeReservar = (
  socio: Socio,
  plan: Plan | undefined,
  clase: Clase,
  actividad: Actividad | undefined,
  cuotas: Cuota[],
  inscripciones: Inscripcion[],
): Elegibilidad => {
  if (!actividad || !plan) return { permitido: false, motivo: 'Tu plan no incluye esta actividad.', adicional: 0 };
  if (!actividad.planes.includes(plan.id)) {
    return { permitido: false, motivo: 'Tu plan no incluye esta actividad.', adicional: 0 };
  }
  if (cuotas.some((c) => c.idSocio === socio.id && estadoCuota(c) === 'vencida')) {
    return { permitido: false, motivo: 'Tenés cuotas en mora. Regularizá tu pago para reservar.', adicional: 0 };
  }
  if (estaInscripto(socio.id, clase, inscripciones)) {
    return { permitido: false, motivo: 'Ya estás inscripto.', adicional: 0 };
  }
  if (ocupados(clase, inscripciones) >= clase.cupo) {
    return { permitido: false, motivo: 'Clase completa.', adicional: 0 };
  }
  const usadas = clasesDelPeriodo(socio.id, inscripciones);
  const excede = plan.clasesPorPeriodo !== null && usadas >= plan.clasesPorPeriodo;
  return { permitido: true, adicional: excede ? adicionalPorClase(plan) : 0 };
};
