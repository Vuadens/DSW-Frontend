import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { asSchema, required, str, time } from '../../lib/forms';
import { DIAS } from '../../lib/format';
import type { DiaSemana, Turno } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z
    .object({ nombre: required, dia: z.string(), desde: time, hasta: time })
    .refine((v) => v.hasta > v.desde, { path: ['hasta'], message: 'Debe terminar después de empezar' }),
);

const fields: FieldDef[] = [
  { name: 'nombre', label: 'Nombre', type: 'text' },
  { name: 'dia', label: 'Día de la semana', type: 'select', options: DIAS.map((d) => ({ value: d, label: d })) },
  { name: 'desde', label: 'Desde', type: 'time' },
  { name: 'hasta', label: 'Hasta', type: 'time' },
];

export default function TurnosPage() {
  const turnos = useDataStore((s) => s.turnos);
  const profesores = useDataStore((s) => s.profesores);
  const ordenados = useMemo(
    () => [...turnos].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.desde.localeCompare(b.desde)),
    [turnos],
  );

  return (
    <EntityPage<Turno>
      title="Turnos"
      lede="Franjas horarias del personal."
      singular="turno"
      collection="turnos"
      items={ordenados}
      fields={fields}
      schema={schema}
      toForm={(t) => ({ nombre: str(t?.nombre), dia: t?.dia ?? 'Lun', desde: str(t?.desde), hasta: str(t?.hasta) })}
      fromForm={(v, existing) => ({ id: existing?.id, nombre: v.nombre.trim(), dia: v.dia as DiaSemana, desde: v.desde, hasta: v.hasta })}
      renderItem={(t) => (
        <>
          <h3>
            {t.dia} · {t.nombre}
          </h3>
          <small>
            {t.desde} a {t.hasta} · {profesores.filter((p) => p.turnos.includes(t.id)).length} profesores
          </small>
        </>
      )}
    />
  );
}
