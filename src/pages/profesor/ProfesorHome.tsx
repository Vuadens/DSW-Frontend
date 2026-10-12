import { useMemo } from 'react';
import { PageHeader } from '../../components/common/Tile';
import { DIAS, claseFecha, diaNumero, fullName, horario } from '../../lib/format';
import { ocupados } from '../../lib/rules';
import { useCurrentUser } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';

export default function ProfesorHome() {
  const user = useCurrentUser();
  const clases = useDataStore((s) => s.clases);
  const actividades = useDataStore((s) => s.actividades);
  const inscripciones = useDataStore((s) => s.inscripciones);
  const socios = useDataStore((s) => s.socios);
  const marcarAsistencia = useDataStore((s) => s.marcarAsistencia);

  const agenda = useMemo(() => {
    const propias = clases.filter((c) => c.idProfesor === user?.id);
    return DIAS.map((dia) => ({
      dia,
      clases: propias.filter((c) => c.dia === dia).sort((a, b) => a.desde.localeCompare(b.desde)),
    })).filter((d) => d.clases.length > 0);
  }, [clases, user?.id]);

  return (
    <>
      <PageHeader title="Mi agenda" lede="Tus clases de la semana y la asistencia de cada una." />
      {agenda.length === 0 && <p className="none">No tenés clases asignadas.</p>}
      {agenda.map(({ dia, clases: delDia }) => (
        <section key={dia} className="day">
          <div className="dn">
            {diaNumero(dia)}
            <small>{dia}</small>
          </div>
          <div className="rows flush">
            {delDia.map((c) => {
              const actividad = actividades.find((a) => a.id === c.idActividad);
              const lista = inscripciones.filter(
                (i) => i.idClase === c.id && i.estado === 'Confirmada' && i.fechaClase === claseFecha(c.dia),
              );
              return (
                <div key={c.id} className="row">
                  <div>
                    <h3>{actividad?.nombre ?? 'Actividad'}</h3>
                    <small>
                      {horario(c.desde, c.hasta)} · {ocupados(c, inscripciones)} de {c.cupo} lugares ocupados
                    </small>
                    {lista.map((i) => {
                      const socio = socios.find((s) => s.id === i.idSocio);
                      return (
                        <label key={i.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                          <input
                            type="checkbox"
                            checked={i.asistio}
                            onChange={(event) => marcarAsistencia(i.id, event.target.checked)}
                          />
                          {socio ? fullName(socio.nombre, socio.apellido) : 'Socio'}
                        </label>
                      );
                    })}
                    {lista.length === 0 && <small>Todavía no hay reservas desde la app.</small>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
