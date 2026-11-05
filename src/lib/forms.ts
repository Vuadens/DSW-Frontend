import { z } from 'zod';
import type { FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import type { Option } from '../components/common/Fields';
import { TODAY } from './format';

export const required = z.string().trim().min(1, 'Campo obligatorio');
export const email = z.string().trim().min(1, 'Campo obligatorio').email('Ingresá un correo válido');
export const optionalText = z.string().trim();
export const positiveNumber = z
  .string()
  .trim()
  .min(1, 'Campo obligatorio')
  .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'Ingresá un número mayor a cero');
export const optionalPositiveNumber = z
  .string()
  .trim()
  .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) > 0), 'Ingresá un número mayor a cero');
export const intNumber = z
  .string()
  .trim()
  .min(1, 'Campo obligatorio')
  .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, 'Ingresá un número entero');
export const date = z.string().min(1, 'Elegí una fecha');
export const optionalDate = z.string();
export const time = z.string().min(1, 'Elegí una hora');
export const ids = z.array(z.string());

/** Los esquemas trabajan con los valores crudos del formulario (strings). */
export const asSchema = (schema: unknown) => schema as ZodType<FieldValues>;

export const toOptions = <T extends { id: number }>(list: T[], label: (item: T) => string): Option[] =>
  list.map((item) => ({ value: String(item.id), label: label(item) }));

export const withEmpty = (options: Option[], emptyLabel: string): Option[] => [{ value: '', label: emptyLabel }, ...options];

export const toId = (value: string) => (value === '' ? null : Number(value));
export const toIds = (values: string[]) => values.map(Number);
export const str = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export const EDAD_MINIMA_SOCIO = 14;
export const EDAD_MINIMA_PROFESOR = 18;
export const FECHA_NAC_MINIMA = '1900-01-01';

/** Última fecha de nacimiento posible para tener `edad` años hoy. */
export const fechaNacMaxima = (edad = 0) => `${Number(TODAY.slice(0, 4)) - edad}${TODAY.slice(4)}`;

/** Fecha de nacimiento con año de 4 cifras, no futura y, si se indica, con edad mínima (como el backend). */
export const fechaNacimiento = (edadMinima?: number) =>
  date
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresá una fecha válida')
    .refine((v) => v >= FECHA_NAC_MINIMA, 'Ingresá una fecha válida')
    .refine((v) => v <= TODAY, 'La fecha de nacimiento no puede ser futura')
    .refine((v) => !edadMinima || v <= fechaNacMaxima(edadMinima), `Tiene que tener al menos ${edadMinima} años`);

/** Campos de Persona, con las mismas reglas que el backend. */
export const persona = {
  nombre: required,
  apellido: required,
  dni: z.string().trim().regex(/^\d{7,9}$/, 'El DNI debe tener entre 7 y 9 números'),
  telefono: z.string().trim().min(6, 'Ingresá un teléfono válido'),
  fechaNac: fechaNacimiento(),
};
