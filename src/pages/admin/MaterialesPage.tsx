import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { asSchema, intNumber, required, str } from '../../lib/forms';
import type { Material } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(z.object({ descripcion: required, stock: intNumber }));

const fields: FieldDef[] = [
  { name: 'descripcion', label: 'Descripción', type: 'text' },
  { name: 'stock', label: 'Stock', type: 'number' },
];

export default function MaterialesPage() {
  const materiales = useDataStore((s) => s.materiales);

  return (
    <EntityPage<Material>
      title="Materiales"
      lede="Elementos de entrenamiento y su stock."
      singular="material"
      collection="materiales"
      items={materiales}
      fields={fields}
      schema={schema}
      toForm={(m) => ({ descripcion: str(m?.descripcion), stock: str(m?.stock) })}
      fromForm={(v, existing) => ({ id: existing?.id, descripcion: v.descripcion.trim(), stock: Number(v.stock) })}
      renderItem={(m) => (
        <>
          <h3>{m.descripcion}</h3>
          <small>Stock: {m.stock} unidades</small>
        </>
      )}
    />
  );
}
