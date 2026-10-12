import { useEffect, useState } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { Dialog } from './Dialog';
import { Fields, type FieldDef } from './Fields';

interface Props {
  open: boolean;
  title: string;
  fields: FieldDef[];
  schema: ZodType<FieldValues>;
  defaultValues: FieldValues;
  submitLabel?: string;
  onClose: () => void;
  /** Devuelve un mensaje de error para mostrar, o undefined si se guardó. */
  onSubmit: (values: FieldValues) => Promise<string | undefined> | string | undefined;
}

export function FormDrawer(props: Props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} label={props.title}>
      <DrawerForm {...props} />
    </Dialog>
  );
}

function DrawerForm({ title, fields, schema, defaultValues, submitLabel = 'Guardar', onClose, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues>({ resolver: zodResolver(schema as never), defaultValues });
  const [serverError, setServerError] = useState<string>();

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit = handleSubmit(async (values) => {
    setServerError(undefined);
    const error = await onSubmit(values);
    if (error) setServerError(error);
  });

  return (
    <form onSubmit={submit} noValidate>
      <h2>{title}</h2>
      <Fields fields={fields} register={register} control={control} errors={errors} />
      {serverError && (
        <p className="err" role="alert">
          {serverError}
        </p>
      )}
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn sm" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
