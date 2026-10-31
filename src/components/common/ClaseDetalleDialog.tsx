import { clasesService, type ClaseDetalle } from '../../api/clases.service';
import { API_ENABLED } from '../../api/httpClient';
import { useDetalle } from '../../hooks/useDetalle';
import { claseFecha, fullName, horario, longDate } from '../../lib/format';
import { ocupados } from '../../lib/rules';
import { useDataStore } from '../../stores/dataStore';
import { Dialog } from './Dialog';

const cargar = async (id: number): Promise<ClaseDetalle> => {
  if (API_ENABLED) return clasesService.detalle(id);
  const { clases, actividades, profesores, inscripciones } = useDataStore.getState();
  const clase = clases.find((c) => c.id === id);
  if (!clase) throw new Error('Clase no encontrada');
  const actividad = actividades.find((a) => a.id === clase.idActividad);
  const profesor = profesores.find((p) => p.id === clase.idProfesor);
  const inscriptos = ocupados(clase, inscripciones);
  return {
    clase,
    fecha: claseFecha(clase.dia),
    inscriptos,
    disponibles: Math.max(0, clase.cupo - inscriptos),
    actividad: { nombre: actividad?.nombre ?? 'Actividad eliminada', descripcion: actividad?.descripcion ?? '' },
    profesor: {
      nombre: profesor ? fullName(profesor.nombre, profesor.apellido) : 'Sin profesor',
      cargo: profesor?.cargo ?? '',
    },
  };
};

export function ClaseDetalleDialog({ claseId, onClose }: { claseId: number | null; onClose: () => void }) {
  const { detalle, error } = useDetalle(claseId, cargar);

  return (
    <Dialog open={claseId !== null} onClose={onClose} variant="modal" label="Detalle de la clase">
      <h2>{detalle?.actividad.nombre ?? 'Clase'}</h2>
      {error && <p className="err" role="alert">{error}</p>}
      {!detalle && !error && <p className="none" role="status">Cargando…</p>}
      {detalle && (
        <dl className="detalle">
          {detalle.actividad.descripcion && <div><dt>Actividad</dt><dd>{detalle.actividad.descripcion}</dd></div>}
          <div>
            <dt>Profesor</dt>
            <dd>{detalle.profesor.nombre}{detalle.profesor.cargo ? ` · ${detalle.profesor.cargo}` : ''}</dd>
          </div>
          <div><dt>Próxima fecha</dt><dd>{longDate(detalle.fecha)}</dd></div>
          <div><dt>Horario</dt><dd>{horario(detalle.clase.desde, detalle.clase.hasta)}</dd></div>
          <div><dt>Cupo</dt><dd>{detalle.inscriptos} de {detalle.clase.cupo} lugares · {detalle.disponibles} disponibles</dd></div>
        </dl>
      )}
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Dialog>
  );
}
