import { useMemo, useState } from 'react';
import { z } from 'zod';
import { Dialog } from '../../components/common/Dialog';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { Pill } from '../../components/common/Tile';
import { DIAS, claseFecha, fullName, horario, longDate } from '../../lib/format';
import { asSchema, intNumber, str, time, toOptions } from '../../lib/forms';
import { ocupados } from '../../lib/rules';
import type { Clase, DiaSemana } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

const schema = asSchema(
  z
    .object({
      idActividad: z.string().min(1, 'Elegí una actividad'),
      dia: z.string(),
      desde: time,
      hasta: time,
      cupo: intNumber.refine((v) => Number(v) > 0, 'El cupo debe ser mayor a cero'),
      idProfesor: z.string().min(1, 'Elegí un profesor'),
    })
    .refine((v) => v.hasta > v.desde, { path: ['hasta'], message: 'Debe terminar después de empezar' }),
);

/** Inscriptos de la próxima fecha de la clase: el admin inscribe socios, cancela o borra inscripciones. */
function InscriptosDialog({ clase, onClose }: { clase: Clase | null; onClose: () => void }) {
  const socios = useDataStore((s) => s.socios);
  const inscripciones = useDataStore((s) => s.inscripciones);
  const actividades = useDataStore((s) => s.actividades);
  const reservar = useDataStore((s) => s.reservar);
  const cancelarReserva = useDataStore((s) => s.cancelarReserva);
  const eliminarInscripcion = useDataStore((s) => s.eliminarInscripcion);
  const showToast = useUiStore((s) => s.showToast);
  const [idSocio, setIdSocio] = useState('');

  const clases = useDataStore((s) => s.clases);

  if (!clase) return null;

  const fecha = claseFecha(clase.dia);
  // La ocupación se recarga después de cada operación: se toma la versión actual de la clase.
  const actual = clases.find((c) => c.id === clase.id) ?? clase;
  const lista = inscripciones.filter((i) => i.idClase === clase.id && i.fechaClase === fecha);
  const confirmadas = lista.filter((i) => i.estado === 'Confirmada');
  const disponibles = socios.filter((s) => !s.fechaBaja && !confirmadas.some((i) => i.idSocio === s.id));
  const actividad = actividades.find((a) => a.id === clase.idActividad);

  const run = async (action: Promise<{ error?: string }>, ok: string) => {
    const result = await action;
    showToast(result.error ?? ok);
  };

  return (
    <Dialog open onClose={onClose} variant="modal" label="Inscriptos">
      <h2>{actividad?.nombre ?? 'Clase'}</h2>
      <p className="lede" style={{ marginTop: 0 }}>
        {longDate(fecha)} · {horario(clase.desde, clase.hasta)} · {ocupados(actual, inscripciones)} de {clase.cupo} lugares
      </p>
      {lista.length === 0 ? (
        <p className="none">Todavía no hay inscriptos para esta fecha.</p>
      ) : (
        <div className="rows flush">
          {lista.map((i) => {
            const socio = socios.find((s) => s.id === i.idSocio);
            return (
              <div key={i.id} className="row">
                <div>
                  <h3>{socio ? fullName(socio.nombre, socio.apellido) : 'Socio'}</h3>
                  {socio && <small>DNI {socio.dni}</small>}
                </div>
                <div className="rb">
                  <Pill kind={i.estado === 'Cancelada' ? 'mora' : 'ok'}>{i.estado}</Pill>
                  {i.estado === 'Confirmada' && (
                    <button type="button" className="btn line sm" onClick={() => run(cancelarReserva(i.id), 'Inscripción cancelada.')}>
                      Cancelar
                    </button>
                  )}
                  <button type="button" className="btn line sm" onClick={() => run(eliminarInscripcion(i.id), 'Inscripción eliminada.')}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="fld">
        <label htmlFor="inscribir-socio">Inscribir socio</label>
        <select id="inscribir-socio" value={idSocio} onChange={(e) => setIdSocio(e.target.value)}>
          <option value="">Elegí un socio</option>
          {disponibles.map((s) => (
            <option key={s.id} value={s.id}>
              {fullName(s.nombre, s.apellido)} · DNI {s.dni}
            </option>
          ))}
        </select>
      </div>
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cerrar
        </button>
        <button
          type="button"
          className="btn sm"
          disabled={!idSocio}
          onClick={async () => {
            await run(reservar(Number(idSocio), clase.id), 'Socio inscripto.');
            setIdSocio('');
          }}
        >
          Inscribir
        </button>
      </div>
    </Dialog>
  );
}

export default function ClasesAdminPage() {
  const clases = useDataStore((s) => s.clases);
  const actividades = useDataStore((s) => s.actividades);
  const profesores = useDataStore((s) => s.profesores);
  const inscripciones = useDataStore((s) => s.inscripciones);
  const [viendo, setViendo] = useState<Clase | null>(null);

  const fields = useMemo<FieldDef[]>(
    () => [
      {
        name: 'idActividad',
        label: 'Actividad',
        type: 'select',
        options: [{ value: '', label: 'Elegí una actividad' }, ...toOptions(actividades, (a) => a.nombre)],
      },
      { name: 'dia', label: 'Día de la semana', type: 'select', options: DIAS.map((d) => ({ value: d, label: d })) },
      { name: 'desde', label: 'Desde', type: 'time' },
      { name: 'hasta', label: 'Hasta', type: 'time' },
      { name: 'cupo', label: 'Cupo', type: 'number' },
      {
        name: 'idProfesor',
        label: 'Profesor',
        type: 'select',
        options: [
          { value: '', label: 'Elegí un profesor' },
          ...toOptions(profesores, (p) => fullName(p.nombre, p.apellido)),
        ],
      },
    ],
    [actividades, profesores],
  );

  const sorted = useMemo(
    () => [...clases].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.desde.localeCompare(b.desde)),
    [clases],
  );

  return (
    <>
      <EntityPage<Clase>
        title="Clases"
        lede="Dictados semanales: día, horario, cupo y profesor."
        singular="clase"
        collection="clases"
        items={sorted}
        fields={fields}
        schema={schema}
        toForm={(c) => ({
          idActividad: str(c?.idActividad),
          dia: c?.dia ?? 'Lun',
          desde: str(c?.desde),
          hasta: str(c?.hasta),
          cupo: str(c?.cupo),
          idProfesor: str(c?.idProfesor),
        })}
        fromForm={(v, existing) => ({
          id: existing?.id,
          idActividad: Number(v.idActividad),
          dia: v.dia as DiaSemana,
          desde: v.desde,
          hasta: v.hasta,
          cupo: Number(v.cupo),
          idProfesor: Number(v.idProfesor),
          ocupadosBase: existing?.ocupadosBase ?? 0,
          inscriptos: existing?.inscriptos,
        })}
        itemClassName={(c) => `class-card class-${c.idActividad % 4}`}
        renderActions={(c) => (
          <button type="button" className="btn line sm" onClick={() => setViendo(c)}>
            Inscriptos
          </button>
        )}
        renderItem={(c) => {
          const actividad = actividades.find((a) => a.id === c.idActividad);
          const profesor = profesores.find((p) => p.id === c.idProfesor);
          return (
            <>
              <h3>{actividad?.nombre ?? 'Actividad eliminada'}</h3>
              <small>
                {c.dia} · {horario(c.desde, c.hasta)} · {profesor ? fullName(profesor.nombre, profesor.apellido) : 'Sin profesor'}
              </small>
              <small>
                Cupo {ocupados(c, inscripciones)} de {c.cupo}
              </small>
            </>
          );
        }}
      />
      <InscriptosDialog clase={viendo} onClose={() => setViendo(null)} />
    </>
  );
}
