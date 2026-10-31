import { useMemo } from 'react';
import { z } from 'zod';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { DIAS, TODAY, fmt, fullName } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import { asSchema, email, ids, persona, positiveNumber, required, str, toIds } from '../../lib/forms';
import type { Profesor, Turno } from '../../models';
import { useDataStore } from '../../stores/dataStore';

// El sueldo no tiene backend todavía (HistoricoSueldo): solo se edita en modo demo.
const schema = asSchema(
  z.object({
    ...persona,
    email,
    cargo: required,
    turnos: ids,
    ...(MODULOS_DEMO ? { sueldo: positiveNumber } : {}),
  }),
);

const sueldoVigente = (p: Profesor) => p.sueldos[p.sueldos.length - 1]?.valor ?? 0;

const turnoLabel = (t: Turno) => `${t.dia} ${t.nombre} (${t.desde} a ${t.hasta})`;

const ordenTurno = (a: Turno, b: Turno) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.desde.localeCompare(b.desde);

export default function ProfesoresPage() {
  const profesores = useDataStore((s) => s.profesores);
  const turnos = useDataStore((s) => s.turnos);
  const ordenados = useMemo(() => [...turnos].sort(ordenTurno), [turnos]);

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text' },
      { name: 'apellido', label: 'Apellido', type: 'text' },
      { name: 'dni', label: 'DNI', type: 'text' },
      { name: 'telefono', label: 'Teléfono', type: 'text' },
      { name: 'fechaNac', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'email', label: 'Email', type: 'email', autoComplete: 'off', hint: 'Con él ingresa al sistema. La contraseña inicial son los últimos 6 dígitos del DNI.' },
      { name: 'cargo', label: 'Cargo', type: 'text' },
      {
        name: 'turnos',
        label: 'Turnos en los que trabaja',
        type: 'multi',
        options: ordenados.map((t) => ({ value: String(t.id), label: turnoLabel(t) })),
      },
      ...(MODULOS_DEMO
        ? [{ name: 'sueldo', label: 'Sueldo vigente', type: 'number' as const, hint: 'Si cambia, se guarda como nuevo valor histórico.' }]
        : []),
    ],
    [ordenados],
  );

  return (
    <EntityPage<Profesor>
      title="Profesores"
      lede={MODULOS_DEMO ? 'Equipo, turnos y sueldos.' : 'Equipo y turnos de trabajo.'}
      singular="profesor"
      collection="profesores"
      items={profesores}
      fields={fields}
      schema={schema}
      searchText={(p) => `${p.nombre} ${p.apellido} ${p.dni} ${p.cargo}`}
      toForm={(p) => ({
        nombre: str(p?.nombre),
        apellido: str(p?.apellido),
        dni: str(p?.dni),
        telefono: str(p?.telefono),
        fechaNac: str(p?.fechaNac),
        email: str(p?.email),
        cargo: str(p?.cargo),
        turnos: (p?.turnos ?? []).map(String),
        sueldo: p ? String(sueldoVigente(p)) : '',
      })}
      fromForm={(v, existing) => {
        const historial = existing?.sueldos ?? [];
        const sueldo = Number(v.sueldo);
        const sueldos =
          !MODULOS_DEMO || (historial.length && sueldoVigente(existing as Profesor) === sueldo)
            ? historial
            : [...historial, { desde: TODAY, valor: sueldo }];
        return {
          id: existing?.id,
          email: v.email.trim(),
          nombre: v.nombre.trim(),
          apellido: v.apellido.trim(),
          dni: v.dni.trim(),
          telefono: v.telefono.trim(),
          fechaNac: v.fechaNac,
          cargo: v.cargo.trim(),
          turnos: toIds(v.turnos),
          sueldos,
        };
      }}
      renderItem={(p) => {
        const propios = ordenados.filter((t) => p.turnos.includes(t.id));
        return (
          <>
            <h3>{fullName(p.nombre, p.apellido)}</h3>
            <small>
              {p.cargo} · DNI {p.dni}
            </small>
            <small>
              {propios.length ? `Turnos: ${propios.map((t) => `${t.dia} ${t.nombre}`).join(', ')}` : 'Sin turnos'}
              {MODULOS_DEMO ? ` · Sueldo ${fmt(sueldoVigente(p))}` : ''}
            </small>
          </>
        );
      }}
    />
  );
}
