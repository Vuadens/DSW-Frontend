import type { DiaSemana } from '../models';
import { API_ENABLED } from '../api/httpClient';

const isoLocal = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Fecha "de hoy". En modo demo es fija, para que los datos sembrados sean coherentes;
 * en modo conectado es la fecha real.
 */
export const TODAY = API_ENABLED ? isoLocal(new Date()) : '2026-10-11';
export const PERIODO_ACTUAL = TODAY.slice(0, 7);
export const ADICIONAL_CLASES = 0.05;

export const fmt = (n: number) => '$\u00a0' + Math.round(n).toLocaleString('es-AR');

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} de ${MESES[Number(m) - 1]} de ${y}`;
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const fullName = (nombre: string, apellido: string) => `${nombre} ${apellido}`.trim();

export const DIAS: DiaSemana[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const WEEK_START_DAY = 12;

/** Próxima fecha (desde hoy, inclusive) que cae en ese día de la semana. */
const proximaFecha = (dia: DiaSemana) => {
  const hoy = new Date(`${TODAY}T12:00:00`);
  const lunesPrimero = (hoy.getDay() + 6) % 7;
  hoy.setDate(hoy.getDate() + ((DIAS.indexOf(dia) - lunesPrimero + 7) % 7));
  return isoLocal(hoy);
};

/**
 * Fecha en la que se dicta la clase de ese día. En modo demo, la semana del 12 de octubre;
 * en modo conectado, la próxima fecha desde hoy (como la calcula el backend).
 */
export const claseFecha = (dia: DiaSemana) => {
  if (API_ENABLED) return proximaFecha(dia);
  const day = WEEK_START_DAY + DIAS.indexOf(dia);
  return `2026-10-${String(day).padStart(2, '0')}`;
};

export const diaNumero = (dia: DiaSemana) => Number(claseFecha(dia).slice(8, 10));

export const diaLabel = (dia: DiaSemana) => `${dia} ${diaNumero(dia)}`;

export const horario = (desde: string, hasta: string) => `${desde} a ${hasta}`;

export const nextId = (items: { id: number }[]) => items.reduce((max, i) => Math.max(max, i.id), 0) + 1;

/** Días como los nombra el backend. */
export type DiaApi = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

const DIAS_API: DiaApi[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export const diaToApi = (dia: DiaSemana): DiaApi => DIAS_API[DIAS.indexOf(dia)];
export const diaFromApi = (dia: DiaApi): DiaSemana => DIAS[DIAS_API.indexOf(dia)];

/** "2026-10-11T00:00:00.000Z" → "2026-10-11". */
export const dateOnly = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');
