import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { DIAS, fullName, horario } from '../../lib/format';
import { asSchema, intNumber, str, time, toOptions } from '../../lib/forms';
import { ocupados } from '../../lib/rules';
import type { Clase, DiaSemana } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z
    .object({
      idActividad: z.string().min(1, 'Elegí una actividad'),
      dia: z.string(),
      desde: time,
      hasta: time,
      cupo: intNumber.refine((v) => Number(v) > 0, 'El cupo debe ser mayor a cero'),
      idProfesor: z.string().min(1, 'Elegí un profesor'),
    })
    .refine((v) => v.hasta > v.desde, { path: ['hasta'], message: 'Debe terminar después de empezar' }),
);

export default function ClasesAdminPage() {
  const clases = useDataStore((s) => s.clases);
  const actividades = useDataStore((s) => s.actividades);
  const profesores = useDataStore((s) => s.profesores);
  const inscripciones = useDataStore((s) => s.inscripciones);

  const fields = useMemo<FieldDef[]>(
    () => [
      {
        name: 'idActividad',
        label: 'Actividad',
        type: 'select',
        options: [{ value: '', label: 'Elegí una actividad' }, ...toOptions(actividades, (a) => a.nombre)],
      },
      { name: 'dia', label: 'Día de la semana', type: 'select', options: DIAS.map((d) => ({ value: d, label: d })) },
      { name: 'desde', label: 'Desde', type: 'time' },
      { name: 'hasta', label: 'Hasta', type: 'time' },
      { name: 'cupo', label: 'Cupo', type: 'number' },
      {
        name: 'idProfesor',
        label: 'Profesor',
        type: 'select',
        options: [
          { value: '', label: 'Elegí un profesor' },
          ...toOptions(profesores, (p) => fullName(p.nombre, p.apellido)),
        ],
      },
    ],
    [actividades, profesores],
  );

  const sorted = useMemo(
    () => [...clases].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.desde.localeCompare(b.desde)),
    [clases],
  );

  return (
    <EntityPage<Clase>
      title="Clases"
      lede="Dictados semanales: día, horario, cupo y profesor."
      singular="clase"
      collection="clases"
      items={sorted}
      fields={fields}
      schema={schema}
      toForm={(c) => ({
        idActividad: str(c?.idActividad),
        dia: c?.dia ?? 'Lun',
        desde: str(c?.desde),
        hasta: str(c?.hasta),
        cupo: str(c?.cupo),
        idProfesor: str(c?.idProfesor),
      })}
      fromForm={(v, existing) => ({
        id: existing?.id,
        idActividad: Number(v.idActividad),
        dia: v.dia as DiaSemana,
        desde: v.desde,
        hasta: v.hasta,
        cupo: Number(v.cupo),
        idProfesor: Number(v.idProfesor),
        ocupadosBase: existing?.ocupadosBase ?? 0,
      })}
      renderItem={(c) => {
        const actividad = actividades.find((a) => a.id === c.idActividad);
        const profesor = profesores.find((p) => p.id === c.idProfesor);
        return (
          <>
            <h3>{actividad?.nombre ?? 'Actividad eliminada'}</h3>
            <small>
              {c.dia} · {horario(c.desde, c.hasta)} · {profesor ? fullName(profesor.nombre, profesor.apellido) : 'Sin profesor'}
            </small>
            <small>
              Cupo {ocupados(c, inscripciones)} de {c.cupo}
            </small>
          </>
        );
      }}
    />
  );
}
