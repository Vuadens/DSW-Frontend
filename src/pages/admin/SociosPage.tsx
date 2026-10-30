import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fmt } from '../../lib/format';
import { estadoCuota } from '../../lib/rules';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { Pill } from '../../components/common/Tile';
import { TODAY, fullName } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import { asSchema, date, optionalDate, persona, str, toId, toOptions } from '../../lib/forms';
import type { Socio } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z.object({
    ...persona,
    fechaAlta: date,
    fechaBaja: optionalDate,
    idPlan: z.string().min(1, 'Elegí un plan'),
  }),
);

export default function SociosPage() {
  const socios = useDataStore((s) => s.socios);
  const planes = useDataStore((s) => s.planes);

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text', autoComplete: 'off' },
      { name: 'apellido', label: 'Apellido', type: 'text', autoComplete: 'off' },
      { name: 'dni', label: 'DNI', type: 'text' },
      { name: 'telefono', label: 'Teléfono', type: 'text' },
      { name: 'fechaNac', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'fechaAlta', label: 'Fecha de alta', type: 'date' },
      { name: 'fechaBaja', label: 'Fecha de baja', type: 'date', hint: 'Dejala vacía si el socio sigue activo.' },
      {
        name: 'idPlan',
        label: 'Plan',
        type: 'select',
        options: [{ value: '', label: 'Elegí un plan' }, ...toOptions(planes, (p) => p.nombre)],
      },
    ],
    [planes],
  );

  return (
    <EntityPage<Socio>
      title="Socios"
      lede="Altas, bajas y plan de cada socio."
      singular="socio"
      collection="socios"
      items={socios}
      fields={fields}
      schema={schema}
      searchText={(s) => `${s.nombre} ${s.apellido} ${s.dni}`}
      toForm={(s) => ({
        nombre: str(s?.nombre),
        apellido: str(s?.apellido),
        dni: str(s?.dni),
        telefono: str(s?.telefono),
        fechaNac: str(s?.fechaNac),
        fechaAlta: s?.fechaAlta ?? TODAY,
        fechaBaja: str(s?.fechaBaja),
        idPlan: str(s?.idPlan),
      })}
      fromForm={(v, existing) => ({
        id: existing?.id,
        email: existing?.email,
        nombre: v.nombre.trim(),
        apellido: v.apellido.trim(),
        dni: v.dni.trim(),
        telefono: v.telefono.trim(),
        fechaNac: v.fechaNac,
        fechaAlta: v.fechaAlta,
        fechaBaja: v.fechaBaja,
        idPlan: toId(v.idPlan),
      })}
      renderActions={
        MODULOS_DEMO
          ? (s) => {
              const balance = useDataStore.getState().cuotas.filter((c) => c.idSocio === s.id && estadoCuota(c) !== 'pagada').reduce((sum, c) => sum + c.valor, 0);
              return <Link className="btn line sm" to={`/app/finanzas?socio=${s.id}`}>{balance ? `Cuotas ${fmt(balance)}` : 'Cuotas al día'}</Link>;
            }
          : undefined
      }
      renderItem={(s) => {
        const plan = planes.find((p) => p.id === s.idPlan);
        return (
          <>
            <h3>{fullName(s.nombre, s.apellido)}</h3>
            <small>
              DNI {s.dni}
              {s.telefono ? ` · ${s.telefono}` : ''}
            </small>
            <small>
              {plan ? plan.nombre : 'Sin plan'}
              {s.fechaBaja ? ' · ' : ''}
              {s.fechaBaja && <Pill kind="mora">De baja</Pill>}
            </small>
          </>
        );
      }}
    />
  );
}
