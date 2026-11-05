import { useMemo, useState } from 'react';
import { ESTADO_CUOTA_SOCIO_LABEL, useSociosPorPlan } from '../../hooks/useSociosPorPlan';
import { Link } from 'react-router-dom';
import { fmt } from '../../lib/format';
import { estadoCuota } from '../../lib/rules';
import { z } from 'zod';
import { Dialog } from '../../components/common/Dialog';
import { EntityPage } from '../../components/common/EntityPage';
import type { FieldDef } from '../../components/common/Fields';
import { SocioDetalleDialog } from '../../components/common/SocioDetalleDialog';
import { Pill } from '../../components/common/Tile';
import { TODAY, fullName } from '../../lib/format';
import { MODULOS_DEMO } from '../../lib/features';
import { EDAD_MINIMA_SOCIO, FECHA_NAC_MINIMA, asSchema, date, email, fechaNacMaxima, fechaNacimiento, persona, str, toId, toOptions } from '../../lib/forms';
import type { Socio } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

// La baja y la reactivación tienen sus propias acciones: no se editan desde el formulario.
const schema = asSchema(
  z.object({
    ...persona,
    fechaNac: fechaNacimiento(EDAD_MINIMA_SOCIO),
    email,
    fechaAlta: date,
    idPlan: z.string().min(1, 'Elegí un plan'),
  }),
);

/** Baja lógica con la fecha de hoy por defecto; no admite fechas futuras ni anteriores al alta. */
function BajaDialog({ socio, onClose }: { socio: Socio | null; onClose: () => void }) {
  const darDeBaja = useDataStore((s) => s.darDeBajaSocio);
  const showToast = useUiStore((s) => s.showToast);
  const [fecha, setFecha] = useState(TODAY);
  const [error, setError] = useState('');

  if (!socio) return null;

  const confirmar = async () => {
    if (!fecha) return setError('Elegí una fecha.');
    if (fecha > TODAY) return setError('La fecha de baja no puede ser futura.');
    if (fecha < socio.fechaAlta) return setError('La fecha de baja no puede ser anterior al alta.');
    const result = await darDeBaja(socio.id, fecha);
    if (result.error) return setError(result.error);
    showToast('Socio dado de baja.');
    onClose();
  };

  return (
    <Dialog open onClose={onClose} variant="modal" label="Dar de baja al socio">
      <h2>Dar de baja a {fullName(socio.nombre, socio.apellido)}</h2>
      <p className="lede" style={{ marginTop: 0 }}>
        Pierde el acceso al sistema y se cancelan sus reservas de hoy en adelante. Podés reactivarlo después.
      </p>
      <div className="fld">
        <label htmlFor="fecha-baja">Fecha de baja</label>
        <input
          id="fecha-baja"
          type="date"
          min={socio.fechaAlta}
          max={TODAY}
          value={fecha}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setFecha(event.target.value);
            setError('');
          }}
        />
        {error && (
          <span className="fld-err" role="alert">
            {error}
          </span>
        )}
      </div>
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn sm" onClick={confirmar}>
          Dar de baja
        </button>
      </div>
    </Dialog>
  );
}

export default function SociosPage() {
  const socios = useDataStore((s) => s.socios);
  const planes = useDataStore((s) => s.planes);
  const reactivar = useDataStore((s) => s.reactivarSocio);
  const showToast = useUiStore((s) => s.showToast);
  const [dandoDeBaja, setDandoDeBaja] = useState<Socio | null>(null);
  // Listado por plan: nombre, apellido, DNI y, para el admin, el estado de la cuota del mes.
  const [planFiltro, setPlanFiltro] = useState<number | null>(null);
  const porPlan = useSociosPorPlan(planFiltro, true);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const visibles = useMemo(
    () => (planFiltro === null ? socios : socios.filter((s) => s.idPlan === planFiltro)),
    [socios, planFiltro],
  );

  const fields = useMemo<FieldDef[]>(
    () => [
      { name: 'nombre', label: 'Nombre', type: 'text', autoComplete: 'off' },
      { name: 'apellido', label: 'Apellido', type: 'text', autoComplete: 'off' },
      { name: 'dni', label: 'DNI', type: 'text' },
      { name: 'telefono', label: 'Teléfono', type: 'text' },
      { name: 'fechaNac', label: 'Fecha de nacimiento', type: 'date', min: FECHA_NAC_MINIMA, max: fechaNacMaxima(EDAD_MINIMA_SOCIO), hint: `Tiene que tener al menos ${EDAD_MINIMA_SOCIO} años.` },
      { name: 'email', label: 'Email', type: 'email', autoComplete: 'off', hint: 'Con él ingresa al sistema. La contraseña inicial son los últimos 6 dígitos del DNI.' },
      { name: 'fechaAlta', label: 'Fecha de alta', type: 'date' },
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
    <>
    <EntityPage<Socio>
      title="Socios"
      lede="Altas, bajas y plan de cada socio."
      singular="socio"
      collection="socios"
      items={visibles}
      filtro={planFiltro}
      header={
        <>
          <div className="tabs" role="group" aria-label="Filtrar por plan">
            <button type="button" aria-pressed={planFiltro === null} onClick={() => setPlanFiltro(null)}>
              Todos
            </button>
            {planes.map((p) => (
              <button key={p.id} type="button" aria-pressed={planFiltro === p.id} onClick={() => setPlanFiltro(p.id)}>
                {p.nombre}
              </button>
            ))}
          </div>
          {porPlan.error && <p className="err" role="alert">{porPlan.error}</p>}
        </>
      }
      fields={fields}
      schema={schema}
      searchText={(s) => `${s.nombre} ${s.apellido} ${s.dni}`}
      toForm={(s) => ({
        nombre: str(s?.nombre),
        apellido: str(s?.apellido),
        dni: str(s?.dni),
        telefono: str(s?.telefono),
        fechaNac: str(s?.fechaNac),
        email: str(s?.email),
        fechaAlta: s?.fechaAlta ?? TODAY,
        idPlan: str(s?.idPlan),
      })}
      fromForm={(v, existing) => ({
        id: existing?.id,
        email: v.email.trim(),
        nombre: v.nombre.trim(),
        apellido: v.apellido.trim(),
        dni: v.dni.trim(),
        telefono: v.telefono.trim(),
        fechaNac: v.fechaNac,
        fechaAlta: v.fechaAlta,
        fechaBaja: existing?.fechaBaja ?? '',
        idPlan: toId(v.idPlan),
      })}
      renderActions={(s) => {
        const balance = useDataStore.getState().cuotas.filter((c) => c.idSocio === s.id && estadoCuota(c) !== 'pagada').reduce((sum, c) => sum + c.valor, 0);
        return (
          <>
            <button type="button" className="btn line sm" onClick={() => setDetalleId(s.id)}>
              Detalle
            </button>
            {s.fechaBaja ? (
              <button
                type="button"
                className="btn line sm"
                onClick={async () => {
                  const result = await reactivar(s.id);
                  showToast(result.error ?? 'Socio reactivado.');
                }}
              >
                Reactivar
              </button>
            ) : (
              <button type="button" className="btn line sm" onClick={() => setDandoDeBaja(s)}>
                Dar de baja
              </button>
            )}
            {MODULOS_DEMO && <Link className="btn line sm" to={`/app/finanzas?socio=${s.id}`}>{balance ? `Cuotas ${fmt(balance)}` : 'Cuotas al día'}</Link>}
          </>
        );
      }}
      renderItem={(s) => {
        const plan = planes.find((p) => p.id === s.idPlan);
        const estado = porPlan.socios.find((x) => x.id === s.id)?.estadoCuota;
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
              {estado && (
                <>
                  {' · '}
                  <Pill kind={estado === 'AL_DIA' ? 'ok' : 'mora'}>{ESTADO_CUOTA_SOCIO_LABEL[estado]}</Pill>
                </>
              )}
            </small>
          </>
        );
      }}
    />
    <SocioDetalleDialog socioId={detalleId} conCuotas onClose={() => setDetalleId(null)} />
    <BajaDialog key={dandoDeBaja?.id} socio={dandoDeBaja} onClose={() => setDandoDeBaja(null)} />
    </>
  );
}
