import { API_ENABLED } from '../api/httpClient';
import type { Actividad, Clase, Cuota, EstadoCuota, EstadoMaquina, Inscripcion, Plan, Socio } from '../models';
import type { EstadoCuotaSocio } from '../api/socios.service';
import { ADICIONAL_CLASES, DIA_VENCIMIENTO, PERIODO_ACTUAL, TODAY, claseFecha, periodoSiguiente, vencimientoCuota } from './format';

export const estadoCuota = (cuota: Cuota): EstadoCuota => {
  if (cuota.fechaPago) return 'pagada';
  return cuota.fechaVencimiento < TODAY ? 'vencida' : 'pendiente';
};

/** Si el socio se da de alta después del vencimiento, su primera cuota es la del mes siguiente (como el backend). */
export const primerPeriodoAdeudado = (fechaAlta: string) =>
  Number(fechaAlta.slice(8, 10)) > DIA_VENCIMIENTO ? periodoSiguiente(fechaAlta.slice(0, 7)) : fechaAlta.slice(0, 7);

/** Último período que adeuda: `hasta`, o el de la baja si es anterior. */
const ultimoPeriodoAdeudado = (socio: Socio, hasta: string) =>
  socio.fechaBaja && socio.fechaBaja.slice(0, 7) < hasta ? socio.fechaBaja.slice(0, 7) : hasta;

/** El id negativo y único por socio y período evita chocar con las cuotas reales. */
const idPendiente = (socio: Socio, periodo: string) => -(socio.id * 1000000 + Number(periodo.replace('-', '')) % 1000000);

const pendientesDe = (cuotas: Cuota[], socio: Socio, planes: Plan[], periodos: string[]): Cuota[] => {
  const plan = planes.find((p) => p.id === socio.idPlan);
  if (!plan) return [];
  return periodos
    .filter((periodo) => !cuotas.some((c) => c.idSocio === socio.id && c.periodo === periodo))
    .map((periodo) => ({
      id: idPendiente(socio, periodo),
      nroComprobante: '',
      idSocio: socio.id,
      periodo,
      valor: plan.precio,
      fechaVencimiento: vencimientoCuota(periodo),
      fechaPago: null,
      metodoPago: null,
    }));
};

/**
 * En el backend una cuota existe recién cuando se cobra: lo que se adeuda de un período
 * se deduce de los socios y su plan, desde su primer mes adeudado hasta el de la baja.
 */
export const cuotasConPendientes = (cuotas: Cuota[], socios: Socio[], planes: Plan[], periodo: string): Cuota[] => {
  if (!API_ENABLED) return cuotas;
  const pendientes = socios.flatMap((socio) =>
    primerPeriodoAdeudado(socio.fechaAlta) <= periodo && ultimoPeriodoAdeudado(socio, periodo) === periodo
      ? pendientesDe(cuotas, socio, planes, [periodo])
      : [],
  );
  return [...cuotas, ...pendientes];
};

/** Como cuotasConPendientes, pero con todos los meses adeudados hasta `hasta`: así se detecta la mora. */
export const cuotasConPendientesHasta = (cuotas: Cuota[], socios: Socio[], planes: Plan[], hasta = PERIODO_ACTUAL): Cuota[] => {
  if (!API_ENABLED) return cuotas;
  const pendientes = socios.flatMap((socio) => {
    const periodos: string[] = [];
    const ultimo = ultimoPeriodoAdeudado(socio, hasta);
    for (let p = primerPeriodoAdeudado(socio.fechaAlta); p <= ultimo; p = periodoSiguiente(p)) periodos.push(p);
    return pendientesDe(cuotas, socio, planes, periodos);
  });
  return [...cuotas, ...pendientes];
};

/** Al día: no debe nada. Pendiente: debe meses que todavía no vencieron. En mora: debe un mes vencido. */
export const estadoCuotasSocio = (propias: Cuota[]): EstadoCuotaSocio => {
  if (propias.some((c) => estadoCuota(c) === 'vencida')) return 'EN_MORA';
  return propias.some((c) => estadoCuota(c) === 'pendiente') ? 'PENDIENTE' : 'AL_DIA';
};

export const ESTADO_CUOTA_SOCIO_LABEL: Record<EstadoCuotaSocio, string> = {
  AL_DIA: 'Cuota al día',
  PENDIENTE: 'Cuota pendiente',
  EN_MORA: 'En mora',
};

export const pillEstadoSocio = (estado: EstadoCuotaSocio) =>
  estado === 'AL_DIA' ? ('ok' as const) : estado === 'EN_MORA' ? ('mora' as const) : undefined;

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

/** En modo conectado la ocupación viene del backend (el socio solo ve sus propias inscripciones). */
export const ocupados = (clase: Clase, inscripciones: Inscripcion[]) =>
  clase.inscriptos ??
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
  const propias = cuotasConPendientesHasta(cuotas, [socio], [plan]).filter((c) => c.idSocio === socio.id);
  if (estadoCuotasSocio(propias) === 'EN_MORA') {
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
