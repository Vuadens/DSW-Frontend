import type { DiaSemana } from '../models';

/** Fecha "de hoy" de la demo, para que los datos sembrados sean coherentes. */
export const TODAY = '2026-10-11';
export const PERIODO_ACTUAL = '2026-10';
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

/** Fecha de la semana en curso que corresponde a un día de dictado. */
export const claseFecha = (dia: DiaSemana) => {
  const day = WEEK_START_DAY + DIAS.indexOf(dia);
  return `2026-10-${String(day).padStart(2, '0')}`;
};

export const diaNumero = (dia: DiaSemana) => WEEK_START_DAY + DIAS.indexOf(dia);

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
