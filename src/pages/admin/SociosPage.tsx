import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { Pill } from '../../components/common/Tile';
import { TODAY, fullName } from '../../lib/format';
import { asSchema, email, optionalDate, optionalText, required, str, toId, toOptions, withEmpty, date } from '../../lib/forms';
import type { Socio } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z.object({
    nombre: required,
    apellido: required,
    dni: z.string().trim().regex(/^\d{7,9}$/, 'El DNI debe tener entre 7 y 9 números'),
    email,
    telefono: optionalText,
    direccion: optionalText,
    fechaNac: optionalDate,
    fechaAlta: date,
    fechaBaja: optionalDate,
    idPlan: z.string(),
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
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'telefono', label: 'Teléfono', type: 'text' },
      { name: 'direccion', label: 'Dirección', type: 'text' },
      { name: 'fechaNac', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'fechaAlta', label: 'Fecha de alta', type: 'date' },
      { name: 'fechaBaja', label: 'Fecha de baja', type: 'date', hint: 'Dejala vacía si el socio sigue activo.' },
      {
        name: 'idPlan',
        label: 'Plan',
        type: 'select',
        options: withEmpty(toOptions(planes, (p) => p.nombre), 'Sin plan'),
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
      searchText={(s) => `${s.nombre} ${s.apellido} ${s.dni} ${s.email}`}
      toForm={(s) => ({
        nombre: str(s?.nombre),
        apellido: str(s?.apellido),
        dni: str(s?.dni),
        email: str(s?.email),
        telefono: str(s?.telefono),
        direccion: str(s?.direccion),
        fechaNac: str(s?.fechaNac),
        fechaAlta: s?.fechaAlta ?? TODAY,
        fechaBaja: str(s?.fechaBaja),
        idPlan: str(s?.idPlan),
      })}
      fromForm={(v, existing) => ({
        id: existing?.id,
        nombre: v.nombre.trim(),
        apellido: v.apellido.trim(),
        dni: v.dni.trim(),
        email: v.email.trim(),
        telefono: v.telefono.trim(),
        direccion: v.direccion.trim(),
        fechaNac: v.fechaNac,
        fechaAlta: v.fechaAlta,
        fechaBaja: v.fechaBaja,
        idPlan: toId(v.idPlan),
      })}
      renderItem={(s) => {
        const plan = planes.find((p) => p.id === s.idPlan);
        return (
          <>
            <h3>{fullName(s.nombre, s.apellido)}</h3>
            <small>
              DNI {s.dni} · {s.email}
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
