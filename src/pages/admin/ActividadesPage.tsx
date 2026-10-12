import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { fullName } from '../../lib/format';
import { asSchema, ids, required, str, toIds, toOptions } from '../../lib/forms';
import type { Actividad, TipoActividad } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z.object({
    nombre: required,
    tipo: z.enum(['Clase', 'Musculación']),
    descripcion: z.string().trim(),
    planes: ids.min(1, 'Elegí al menos un plan'),
    materiales: ids,
    maquinas: ids,
    profesores: ids,
  }),
);

export default function ActividadesPage() {
  const actividades = useDataStore((s) => s.actividades);
  const planes = useDataStore((s) => s.planes);
  const materiales = useDataStore((s) => s.materiales);
  const maquinas = useDataStore((s) => s.maquinas);
  const profesores = useDataStore((s) => s.profesores);

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: 'Clase', label: 'Clase grupal' },
          { value: 'Musculación', label: 'Musculación' },
        ],
      },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'planes', label: 'Planes habilitados', type: 'multi', options: toOptions(planes, (p) => p.nombre) },
      { name: 'materiales', label: 'Materiales', type: 'multi', options: toOptions(materiales, (m) => m.descripcion) },
      { name: 'maquinas', label: 'Máquinas', type: 'multi', options: toOptions(maquinas, (m) => m.nombre) },
      {
        name: 'profesores',
        label: 'Profesores',
        type: 'multi',
        options: toOptions(profesores, (p) => fullName(p.nombre, p.apellido)),
      },
    ],
    [planes, materiales, maquinas, profesores],
  );

  const names = <T extends { id: number }>(list: T[], selected: number[], label: (item: T) => string) =>
    list
      .filter((i) => selected.includes(i.id))
      .map(label)
      .join(', ') || 'ninguno';

  return (
    <EntityPage<Actividad>
      title="Actividades"
      lede="Qué se ofrece, quién la dicta y con qué recursos."
      singular="actividad"
      collection="actividades"
      items={actividades}
      fields={fields}
      schema={schema}
      searchText={(a) => `${a.nombre} ${a.tipo}`}
      toForm={(a) => ({
        nombre: str(a?.nombre),
        tipo: a?.tipo ?? 'Clase',
        descripcion: str(a?.descripcion),
        planes: (a?.planes ?? []).map(String),
        materiales: (a?.materiales ?? []).map(String),
        maquinas: (a?.maquinas ?? []).map(String),
        profesores: (a?.profesores ?? []).map(String),
      })}
      fromForm={(v, existing) => ({
        id: existing?.id,
        nombre: v.nombre.trim(),
        tipo: v.tipo as TipoActividad,
        descripcion: v.descripcion.trim(),
        planes: toIds(v.planes),
        materiales: toIds(v.materiales),
        maquinas: toIds(v.maquinas),
        profesores: toIds(v.profesores),
      })}
      renderItem={(a) => (
        <>
          <h3>
            {a.nombre} · {a.tipo}
          </h3>
          <small>{a.descripcion || 'Sin descripción'}</small>
          <small>Planes: {names(planes, a.planes, (p) => p.nombre)}</small>
          <small>Profesores: {names(profesores, a.profesores, (p) => fullName(p.nombre, p.apellido))}</small>
        </>
      )}
    />
  );
}
