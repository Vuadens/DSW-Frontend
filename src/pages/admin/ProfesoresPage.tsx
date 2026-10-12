import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { TODAY, fmt, fullName } from '../../lib/format';
import { asSchema, email, optionalText, positiveNumber, required, str, toId, toOptions, withEmpty } from '../../lib/forms';
import type { Profesor } from '../../models';
import { useDataStore } from '../../stores/dataStore';

const schema = asSchema(
  z.object({
    nombre: required,
    apellido: required,
    cargo: required,
    email,
    telefono: optionalText,
    idTurno: z.string(),
    idSupervisor: z.string(),
    sueldo: positiveNumber,
  }),
);

const sueldoVigente = (p: Profesor) => p.sueldos[p.sueldos.length - 1]?.valor ?? 0;

export default function ProfesoresPage() {
  const profesores = useDataStore((s) => s.profesores);
  const turnos = useDataStore((s) => s.turnos);

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'apellido', label: 'Apellido', type: 'text' },
      { name: 'cargo', label: 'Cargo', type: 'text' },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'telefono', label: 'Teléfono', type: 'text' },
      {
        name: 'idTurno',
        label: 'Turno',
        type: 'select',
        options: withEmpty(toOptions(turnos, (t) => `${t.nombre} (${t.desde} a ${t.hasta})`), 'Sin turno'),
      },
      {
        name: 'idSupervisor',
        label: 'Supervisor',
        type: 'select',
        options: withEmpty(toOptions(profesores, (p) => fullName(p.nombre, p.apellido)), 'Sin supervisor'),
      },
      { name: 'sueldo', label: 'Sueldo vigente', type: 'number', hint: 'Si cambia, se guarda como nuevo valor histórico.' },
    ],
    [turnos, profesores],
  );

  return (
    <EntityPage<Profesor>
      title="Profesores"
      lede="Equipo, turnos, supervisores y sueldos."
      singular="profesor"
      collection="profesores"
      items={profesores}
      fields={fields}
      schema={schema}
      searchText={(p) => `${p.nombre} ${p.apellido} ${p.cargo} ${p.email}`}
      toForm={(p) => ({
        nombre: str(p?.nombre),
        apellido: str(p?.apellido),
        cargo: str(p?.cargo),
        email: str(p?.email),
        telefono: str(p?.telefono),
        idTurno: str(p?.idTurno),
        idSupervisor: str(p?.idSupervisor),
        sueldo: p ? String(sueldoVigente(p)) : '',
      })}
      fromForm={(v, existing) => {
        const sueldo = Number(v.sueldo);
        const historial = existing?.sueldos ?? [];
        const sueldos =
          historial.length && sueldoVigente(existing as Profesor) === sueldo
            ? historial
            : [...historial, { desde: TODAY, valor: sueldo }];
        const supervisor = toId(v.idSupervisor);
        return {
          id: existing?.id,
          nombre: v.nombre.trim(),
          apellido: v.apellido.trim(),
          cargo: v.cargo.trim(),
          email: v.email.trim(),
          telefono: v.telefono.trim(),
          idTurno: toId(v.idTurno),
          idSupervisor: supervisor === existing?.id ? null : supervisor,
          sueldos,
        };
      }}
      renderItem={(p) => {
        const turno = turnos.find((t) => t.id === p.idTurno);
        const supervisor = profesores.find((x) => x.id === p.idSupervisor);
        return (
          <>
            <h3>{fullName(p.nombre, p.apellido)}</h3>
            <small>
              {p.cargo} · {p.email}
            </small>
            <small>
              {turno ? `Turno ${turno.nombre}` : 'Sin turno'}
              {supervisor ? ` · Supervisa ${fullName(supervisor.nombre, supervisor.apellido)}` : ''} · Sueldo {fmt(sueldoVigente(p))}
            </small>
          </>
        );
      }}
    />
  );
}
