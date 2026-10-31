import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { fmt } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import { asSchema, optionalPositiveNumber, positiveNumber, required, str } from '../../lib/forms';
import type { Plan, TipoPlan } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z.object({
    nombre: required,
    tipo: z.enum(['PREMIUM', 'PRO', 'ESTANDAR']),
    precio: positiveNumber,
    descripcion: z.string().trim(),
    clasesPorPeriodo: optionalPositiveNumber,
  }),
);

const fields: FieldDef[] = [
  { name: 'nombre', label: 'Nombre', type: 'text' },
  {
    name: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'ESTANDAR', label: 'Estándar' },
      { value: 'PRO', label: 'Pro' },
      { value: 'PREMIUM', label: 'Premium' },
    ],
  },
  { name: 'precio', label: 'Precio mensual', type: 'number' },
  // El backend todavía no guarda las clases por período.
  ...(MODULOS_DEMO
    ? [{ name: 'clasesPorPeriodo', label: 'Clases por período', type: 'number' as const, hint: 'Dejalo vacío para clases ilimitadas.' }]
    : []),
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
];

export default function PlanesPage() {
  const planes = useDataStore((s) => s.planes);
  const socios = useDataStore((s) => s.socios);

  return (
    <EntityPage<Plan>
      title="Planes"
      lede="Precio y alcance de cada membresía."
      singular="plan"
      collection="planes"
      items={planes}
      fields={fields}
      schema={schema}
      toForm={(p) => ({
        nombre: str(p?.nombre),
        tipo: p?.tipo ?? 'ESTANDAR',
        precio: str(p?.precio),
        descripcion: str(p?.descripcion),
        clasesPorPeriodo: str(p?.clasesPorPeriodo),
      })}
      fromForm={(v, existing) => ({
        id: existing?.id,
        nombre: v.nombre.trim(),
        tipo: v.tipo as TipoPlan,
        precio: Number(v.precio),
        descripcion: v.descripcion.trim(),
        clasesPorPeriodo: v.clasesPorPeriodo === '' ? null : Number(v.clasesPorPeriodo),
      })}
      renderItem={(p) => (
        <>
          <h3>
            {p.nombre} · {fmt(p.precio)}
          </h3>
          <small>{p.descripcion || 'Sin descripción'}</small>
          <small>
            {MODULOS_DEMO && `${p.clasesPorPeriodo ? `${p.clasesPorPeriodo} clases por mes` : 'Clases ilimitadas'} · `}
            {socios.filter((s) => s.idPlan === p.id).length} socios
          </small>
        </>
      )}
    />
  );
}
