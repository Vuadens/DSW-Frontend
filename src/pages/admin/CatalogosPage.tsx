import { useMemo, useState } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { asSchema, intNumber, required, str, time } from '../../lib/forms';
import { DIAS } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import type { DiaSemana, Material, Turno } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const turnoSchema = asSchema(
  z
    .object({ nombre: required, dia: z.string(), desde: time, hasta: time })
    .refine((v) => v.hasta > v.desde, { path: ['hasta'], message: 'Debe terminar después de empezar' }),
);
const materialSchema = asSchema(z.object({ descripcion: required, stock: intNumber }));

const turnoFields: FieldDef[] = [
  { name: 'nombre', label: 'Nombre', type: 'text' },
  { name: 'dia', label: 'Día de la semana', type: 'select', options: DIAS.map((d) => ({ value: d, label: d })) },
  { name: 'desde', label: 'Desde', type: 'time' },
  { name: 'hasta', label: 'Hasta', type: 'time' },
];
const materialFields: FieldDef[] = [
  { name: 'descripcion', label: 'Descripción', type: 'text' },
  { name: 'stock', label: 'Stock', type: 'number' },
];

export default function CatalogosPage() {
  const [tab, setTab] = useState<'turnos' | 'materiales'>('turnos');
  const turnos = useDataStore((s) => s.turnos);
  const materiales = useDataStore((s) => s.materiales);
  const profesores = useDataStore((s) => s.profesores);
  const ordenados = useMemo(
    () => [...turnos].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.desde.localeCompare(b.desde)),
    [turnos],
  );

  return (
    <>
      {/* Materiales todavía no tiene backend: en modo conectado solo se ven los turnos. */}
      {MODULOS_DEMO && (
        <div className="tabs" role="group" aria-label="Catálogo">
          <button type="button" aria-pressed={tab === 'turnos'} onClick={() => setTab('turnos')}>
            Turnos
          </button>
          <button type="button" aria-pressed={tab === 'materiales'} onClick={() => setTab('materiales')}>
            Materiales
          </button>
        </div>
      )}
      {tab === 'turnos' ? (
        <EntityPage<Turno>
          key="turnos"
          title="Turnos"
          lede="Franjas horarias del personal."
          singular="turno"
          collection="turnos"
          items={ordenados}
          fields={turnoFields}
          schema={turnoSchema}
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
      ) : (
        <EntityPage<Material>
          key="materiales"
          title="Materiales"
          lede="Elementos de entrenamiento y su stock."
          singular="material"
          collection="materiales"
          items={materiales}
          fields={materialFields}
          schema={materialSchema}
          toForm={(m) => ({ descripcion: str(m?.descripcion), stock: str(m?.stock) })}
          fromForm={(v, existing) => ({ id: existing?.id, descripcion: v.descripcion.trim(), stock: Number(v.stock) })}
          renderItem={(m) => (
            <>
              <h3>{m.descripcion}</h3>
              <small>Stock: {m.stock} unidades</small>
            </>
          )}
        />
      )}
    </>
  );
}
