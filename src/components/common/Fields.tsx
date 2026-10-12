import { Controller, type Control, type FieldErrors, type UseFormRegister, type FieldValues } from 'react-hook-form';

export interface Option {
  value: string;
  label: string;
}

export type FieldType = 'text' | 'email' | 'number' | 'date' | 'time' | 'select' | 'multi' | 'textarea' | 'password';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: Option[];
  placeholder?: string;
  /** Texto que aclara el campo, por ejemplo qué significa dejarlo vacío. */
  hint?: string;
  step?: string;
  autoComplete?: string;
}

interface Props {
  fields: FieldDef[];
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
  errors: FieldErrors<FieldValues>;
}

export function Fields({ fields, register, control, errors }: Props) {
  return (
    <>
      {fields.map((field) => {
        const error = errors[field.name]?.message as string | undefined;
        const id = `f-${field.name}`;
        const describedBy = error ? `${id}-err` : undefined;

        if (field.type === 'multi') {
          return (
            <fieldset key={field.name} className="mu">
              <legend>{field.label}</legend>
              <Controller
                control={control}
                name={field.name}
                render={({ field: { value, onChange } }) => (
                  <>
                    {(field.options ?? []).map((option) => {
                      const selected = (value as string[]) ?? [];
                      return (
                        <label key={option.value} className="ck">
                          <input
                            type="checkbox"
                            checked={selected.includes(option.value)}
                            onChange={(event) =>
                              onChange(
                                event.target.checked
                                  ? [...selected, option.value]
                                  : selected.filter((v) => v !== option.value),
                              )
                            }
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </>
                )}
              />
              {error && (
                <span id={`${id}-err`} className="fld-err" role="alert">
                  {error}
                </span>
              )}
            </fieldset>
          );
        }

        return (
          <div key={field.name} className="fld">
            <label htmlFor={id}>{field.label}</label>
            {field.type === 'select' ? (
              <select id={id} aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.name)}>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={id}
                rows={3}
                placeholder={field.placeholder}
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
                {...register(field.name)}
              />
            ) : (
              <input
                id={id}
                type={field.type}
                step={field.step}
                inputMode={field.type === 'number' ? 'decimal' : undefined}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
                {...register(field.name)}
              />
            )}
            {field.hint && !error && <span className="fld-hint">{field.hint}</span>}
            {error && (
              <span id={`${id}-err`} className="fld-err" role="alert">
                {error}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
