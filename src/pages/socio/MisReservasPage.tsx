import { useState } from 'react';
import { ConfirmDialog } from '../../components/common/Dialog';
import { PageHeader, Pill } from '../../components/common/Tile';
import { TODAY, fullName, horario, longDate } from '../../lib/format';
import type { Inscripcion } from '../../models';
import { useCurrentUser } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

export default function MisReservasPage() {
  const user = useCurrentUser();
  const inscripciones = useDataStore((s) => s.inscripciones);
  const clases = useDataStore((s) => s.clases);
  const actividades = useDataStore((s) => s.actividades);
  const profesores = useDataStore((s) => s.profesores);
  const cancelarReserva = useDataStore((s) => s.cancelarReserva);
  const showToast = useUiStore((s) => s.showToast);
  const [cancelling, setCancelling] = useState<Inscripcion | null>(null);

  const propias = inscripciones
    .filter((i) => i.idSocio === user?.id)
    .sort((a, b) => b.fechaClase.localeCompare(a.fechaClase));

  return (
    <>
      <PageHeader title="Mis reservas" lede="Tus clases reservadas y tu historial." />
      {propias.length === 0 ? (
        <p className="none">Todavía no reservaste ninguna clase.</p>
      ) : (
        <div className="rows flush">
          {propias.map((i) => {
            const clase = clases.find((c) => c.id === i.idClase);
            const actividad = actividades.find((a) => a.id === clase?.idActividad);
            const profesor = profesores.find((p) => p.id === clase?.idProfesor);
            const futura = i.estado === 'Confirmada' && i.fechaClase >= TODAY;
            return (
              <div key={i.id} className="row">
                <div>
                  <h3>{actividad?.nombre ?? 'Clase'}</h3>
                  <small>
                    {longDate(i.fechaClase)}
                    {clase ? ` · ${horario(clase.desde, clase.hasta)}` : ''}
                  </small>
                  {profesor && <small>{fullName(profesor.nombre, profesor.apellido)}</small>}
                </div>
                <div className="rb">
                  <Pill kind={i.estado === 'Cancelada' ? 'mora' : futura ? 'ok' : undefined}>
                    {i.estado === 'Cancelada' ? 'Cancelada' : futura ? 'Confirmada' : i.asistio ? 'Asististe' : 'Pasada'}
                  </Pill>
                  {futura && (
                    <button type="button" className="btn line sm" onClick={() => setCancelling(i)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={cancelling !== null}
        title="Cancelar reserva"
        message="Vas a liberar tu lugar en esta clase."
        confirmLabel="Cancelar reserva"
        onCancel={() => setCancelling(null)}
        onConfirm={async () => {
          if (!cancelling) return;
          const result = await cancelarReserva(cancelling.id);
          showToast(result.error ?? 'Reserva cancelada.');
          setCancelling(null);
        }}
      />
    </>
  );
}
