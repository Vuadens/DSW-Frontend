import { API_ENABLED } from '../../api/httpClient';
import { sociosService, type SocioDetalle } from '../../api/socios.service';
import { useDetalle } from '../../hooks/useDetalle';
import { ESTADO_CUOTA_SOCIO_LABEL } from '../../hooks/useSociosPorPlan';
import { PERIODO_ACTUAL, fmt, fullName, longDate } from '../../lib/format';
import { ESTADO_CUOTA_LABEL, estadoCuota, periodoLabel } from '../../lib/rules';
import { useDataStore } from '../../stores/dataStore';
import { Dialog } from './Dialog';
import { Pill } from './Tile';

const ULTIMAS_CUOTAS = 6;

const cargar = async (id: number): Promise<SocioDetalle> => {
  if (API_ENABLED) return sociosService.detalle(id);
  const { socios, planes, cuotas } = useDataStore.getState();
  const socio = socios.find((s) => s.id === id);
  if (!socio) throw new Error('Socio no encontrado');
  const propias = cuotas.filter((c) => c.idSocio === id).sort((a, b) => b.periodo.localeCompare(a.periodo));
  return {
    socio,
    plan: planes.find((p) => p.id === socio.idPlan)?.nombre ?? 'Sin plan',
    cuotas: propias,
    estadoCuota: propias.some((c) => c.periodo === PERIODO_ACTUAL && c.fechaPago) ? 'AL_DIA' : 'ADEUDA',
    ultimoMesPagado: propias.find((c) => c.fechaPago)?.periodo ?? null,
  };
};

interface Props {
  socioId: number | null;
  /** El estado de las cuotas solo lo ve el administrador. */
  conCuotas: boolean;
  onClose: () => void;
}

export function SocioDetalleDialog({ socioId, conCuotas, onClose }: Props) {
  const { detalle, error } = useDetalle(socioId, cargar);
  // El detalle del backend no trae la cuenta: el email sale del listado.
  const email = useDataStore((s) => s.socios.find((x) => x.id === socioId)?.email);

  return (
    <Dialog open={socioId !== null} onClose={onClose} variant="modal" label="Detalle del socio">
      <h2>{detalle ? fullName(detalle.socio.nombre, detalle.socio.apellido) : 'Socio'}</h2>
      {error && <p className="err" role="alert">{error}</p>}
      {!detalle && !error && <p className="none" role="status">Cargando…</p>}
      {detalle && (
        <>
          <dl className="detalle">
            <div><dt>DNI</dt><dd>{detalle.socio.dni}</dd></div>
            <div><dt>Plan</dt><dd>{detalle.plan}</dd></div>
            <div><dt>Teléfono</dt><dd>{detalle.socio.telefono || 'Sin cargar'}</dd></div>
            <div><dt>Email</dt><dd>{email || 'Sin cargar'}</dd></div>
            {detalle.socio.fechaNac && <div><dt>Nacimiento</dt><dd>{longDate(detalle.socio.fechaNac)}</dd></div>}
            {detalle.socio.fechaAlta && <div><dt>Alta</dt><dd>{longDate(detalle.socio.fechaAlta)}</dd></div>}
          </dl>
          {conCuotas && (
            <>
              <p>
                <Pill kind={detalle.estadoCuota === 'AL_DIA' ? 'ok' : 'mora'}>{ESTADO_CUOTA_SOCIO_LABEL[detalle.estadoCuota]}</Pill>
              </p>
              <p className="lede" style={{ marginTop: 8, fontSize: 15 }}>
                {detalle.ultimoMesPagado ? `Último mes pagado: ${periodoLabel(detalle.ultimoMesPagado)}` : 'Todavía no registra pagos.'}
              </p>
              <div className="rows flush">
                {detalle.cuotas.slice(0, ULTIMAS_CUOTAS).map((c) => {
                  const estado = estadoCuota(c);
                  return (
                    <div key={c.id} className="row compact">
                      <div>
                        <small>{periodoLabel(c.periodo)} · {fmt(c.valor)}</small>
                      </div>
                      <Pill kind={estado === 'pagada' ? 'ok' : estado === 'vencida' ? 'mora' : undefined}>{ESTADO_CUOTA_LABEL[estado]}</Pill>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Dialog>
  );
}
