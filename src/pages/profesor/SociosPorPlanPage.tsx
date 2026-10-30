import { useState } from 'react';
import { PageHeader } from '../../components/common/Tile';
import { useSociosPorPlan } from '../../hooks/useSociosPorPlan';
import { fullName } from '../../lib/format';
import { useDataStore } from '../../stores/dataStore';

/** Listado de socios por plan para el profesor: nombre, apellido y DNI (sin estado de cuota). */
export default function SociosPorPlanPage() {
  const planes = useDataStore((s) => s.planes);
  const [planId, setPlanId] = useState<number | null>(planes[0]?.id ?? null);
  const elegido = planId ?? planes[0]?.id ?? null;
  const { socios, error } = useSociosPorPlan(elegido, false);

  return (
    <>
      <PageHeader title="Socios por plan" lede="Nombre, apellido y DNI de los socios de cada plan." />
      <div className="tabs" role="group" aria-label="Plan">
        {planes.map((p) => (
          <button key={p.id} type="button" aria-pressed={elegido === p.id} onClick={() => setPlanId(p.id)}>
            {p.nombre}
          </button>
        ))}
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      {socios.length === 0 ? (
        <p className="none">No hay socios en este plan.</p>
      ) : (
        <div className="rows flush">
          {socios.map((s) => (
            <div key={s.id} className="row">
              <div>
                <h3>{fullName(s.nombre, s.apellido)}</h3>
                <small>DNI {s.dni}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
