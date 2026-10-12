import { useMemo } from 'react';
import { PageHeader, Tile, TileFooter } from '../../components/common/Tile';
import { DIAS, diaNumero, fmt, fullName, horario } from '../../lib/format';
import { estaInscripto, ocupados, puedeReservar } from '../../lib/rules';
import type { Tone } from '../../models';
import { useCurrentUser } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

const TONES: Tone[] = ['orange', 'green', 'purple', 'blue', 'yellow', 'red'];

export default function ReservarPage() {
  const user = useCurrentUser();
  const socios = useDataStore((s) => s.socios);
  const planes = useDataStore((s) => s.planes);
  const clases = useDataStore((s) => s.clases);
  const actividades = useDataStore((s) => s.actividades);
  const profesores = useDataStore((s) => s.profesores);
  const cuotas = useDataStore((s) => s.cuotas);
  const inscripciones = useDataStore((s) => s.inscripciones);
  const reservar = useDataStore((s) => s.reservar);
  const showToast = useUiStore((s) => s.showToast);

  const socio = socios.find((s) => s.id === user?.id);
  const plan = planes.find((p) => p.id === socio?.idPlan);

  const porDia = useMemo(
    () =>
      DIAS.map((dia) => ({
        dia,
        clases: clases.filter((c) => c.dia === dia).sort((a, b) => a.desde.localeCompare(b.desde)),
      })).filter((d) => d.clases.length > 0),
    [clases],
  );

  if (!socio) return null;

  return (
    <>
      <PageHeader title="Reservar clase" lede="Elegí un horario de esta semana. Si superás tu cupo mensual se suma un adicional." />
      {porDia.map(({ dia, clases: delDia }) => (
        <section key={dia} className="day">
          <div className="dn">
            {diaNumero(dia)}
            <small>{dia}</small>
          </div>
          <div className="tiles">
            {delDia.map((c) => {
              const actividad = actividades.find((a) => a.id === c.idActividad);
              const profesor = profesores.find((p) => p.id === c.idProfesor);
              const check = puedeReservar(socio, plan, c, actividad, cuotas, inscripciones);
              const inscripto = estaInscripto(socio.id, c, inscripciones);
              const usados = ocupados(c, inscripciones);
              return (
                <Tile key={c.id} tone={TONES[c.idActividad % TONES.length]} mine={inscripto}>
                  <h3>{actividad?.nombre ?? 'Clase'}</h3>
                  <p>
                    {horario(c.desde, c.hasta)}
                    {profesor ? ` · ${fullName(profesor.nombre, profesor.apellido)}` : ''}
                  </p>
                  <div className="bar" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, (usados / c.cupo) * 100)}%` }} />
                  </div>
                  <p>
                    {usados} de {c.cupo} lugares
                  </p>
                  <TileFooter>
                    {inscripto ? (
                      <span className="btn sm" aria-disabled="true">
                        Inscripto
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn sm"
                        disabled={!check.permitido}
                        onClick={() => {
                          const result = reservar(socio.id, c.id);
                          if (result.error) return showToast(result.error);
                          showToast(
                            result.adicional
                              ? `Reserva confirmada. Se agregó un adicional de ${fmt(result.adicional)}.`
                              : 'Reserva confirmada.',
                          );
                        }}
                      >
                        Reservar
                      </button>
                    )}
                    {!inscripto && !check.permitido && <p style={{ marginTop: 8 }}>{check.motivo}</p>}
                    {!inscripto && check.permitido && check.adicional > 0 && (
                      <p style={{ marginTop: 8 }}>Adicional: {fmt(check.adicional)}</p>
                    )}
                  </TileFooter>
                </Tile>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
