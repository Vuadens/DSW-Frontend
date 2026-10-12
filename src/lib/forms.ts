import { z } from 'zod';
import type { FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import type { Option } from '../components/common/Fields';

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
