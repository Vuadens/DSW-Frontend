import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { fullName } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import { asSchema, ids, intNumber, required, str, toIds, toOptions } from '../../lib/forms';
import type { Actividad, TipoActividad } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z.object({
    nombre: required,
    tipo: z.enum(['Clase', 'Musculación']),
    descripcion: z.string().trim(),
    cupoMaximo: intNumber.refine((v) => Number(v) > 0 && Number(v) <= 500, 'El cupo debe estar entre 1 y 500'),
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

  // Tipo, materiales, máquinas y profesores todavía no tienen backend: solo modo demo.
  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      ...(MODULOS_DEMO
        ? [
            {
              name: 'tipo',
              label: 'Tipo',
              type: 'select' as const,
              options: [
                { value: 'Clase', label: 'Clase grupal' },
                { value: 'Musculación', label: 'Musculación' },
              ],
            },
          ]
        : []),
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'cupoMaximo', label: 'Cupo máximo por clase', type: 'number' },
      { name: 'planes', label: 'Planes habilitados', type: 'multi', options: toOptions(planes, (p) => p.nombre) },
      ...(MODULOS_DEMO
        ? [
            { name: 'materiales', label: 'Materiales', type: 'multi' as const, options: toOptions(materiales, (m) => m.descripcion) },
            { name: 'maquinas', label: 'Máquinas', type: 'multi' as const, options: toOptions(maquinas, (m) => m.nombre) },
            {
              name: 'profesores',
              label: 'Profesores',
              type: 'multi' as const,
              options: toOptions(profesores, (p) => fullName(p.nombre, p.apellido)),
            },
          ]
        : []),
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
      lede={MODULOS_DEMO ? 'Qué se ofrece, quién la dicta y con qué recursos.' : 'Qué se ofrece, su cupo y en qué planes se incluye.'}
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
        cupoMaximo: a ? String(a.cupoMaximo) : '20',
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
        cupoMaximo: Number(v.cupoMaximo),
        planes: toIds(v.planes),
        materiales: toIds(v.materiales),
        maquinas: toIds(v.maquinas),
        profesores: toIds(v.profesores),
      })}
      renderItem={(a) => (
        <>
          <h3>{MODULOS_DEMO ? `${a.nombre} · ${a.tipo}` : a.nombre}</h3>
          <small>{a.descripcion || 'Sin descripción'}</small>
          <small>
            Cupo máximo {a.cupoMaximo} · Planes: {names(planes, a.planes, (p) => p.nombre)}
          </small>
          {MODULOS_DEMO && <small>Profesores: {names(profesores, a.profesores, (p) => fullName(p.nombre, p.apellido))}</small>}
        </>
      )}
    />
  );
}
