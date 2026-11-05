import { Paginacion, usePaginacion } from '../../components/common/Paginacion';
import { PageHeader, Pill } from '../../components/common/Tile';
import { MODULOS_DEMO } from '../../lib/features';
import { DIA_VENCIMIENTO, fmt, longDate } from '../../lib/format';
import { ESTADO_CUOTA_LABEL, cuotasConPendientesHasta, estadoCuota, periodoLabel } from '../../lib/rules';
import { useCurrentUser } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

export default function MisCuotasPage() {
  const user = useCurrentUser();
  const cuotas = useDataStore((s) => s.cuotas);
  const socios = useDataStore((s) => s.socios);
  const planes = useDataStore((s) => s.planes);
  const pagarCuota = useDataStore((s) => s.pagarCuota);
  const showToast = useUiStore((s) => s.showToast);

  const propias = cuotasConPendientesHasta(cuotas, socios.filter((s) => s.id === user?.id), planes)
    .filter((c) => c.idSocio === user?.id)
    .sort((a, b) => b.fechaVencimiento.localeCompare(a.fechaVencimiento));
  const { visibles, paginacion } = usePaginacion(propias);

  return (
    <>
      <PageHeader title="Mis cuotas" lede={MODULOS_DEMO ? 'Pagá online y descargá tu historial.' : `Tus pagos y lo que adeudás. Vencen el día ${DIA_VENCIMIENTO} de cada mes y se abonan en recepción.`} />
      {propias.length === 0 ? (
        <p className="none">No tenés cuotas generadas.</p>
      ) : (
        <div className="rows flush">
          {visibles.map((c) => {
            const estado = estadoCuota(c);
            return (
              <div key={c.id} className="row">
                <div>
                  <h3>{periodoLabel(c.periodo)}</h3>
                  {c.nroComprobante && <small>{c.nroComprobante}</small>}
                  <small>
                    {c.fechaPago
                      ? `Pagada el ${longDate(c.fechaPago)}${c.metodoPago ? ` con ${c.metodoPago}` : ''}`
                      : `Vence el ${longDate(c.fechaVencimiento)}`}
                  </small>
                </div>
                <span className="a">{fmt(c.valor)}</span>
                <div className="rb">
                  <Pill kind={estado === 'pagada' ? 'ok' : estado === 'vencida' ? 'mora' : undefined}>
                    {ESTADO_CUOTA_LABEL[estado]}
                  </Pill>
                  {MODULOS_DEMO && estado !== 'pagada' && (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={async () => {
                        const result = await pagarCuota(c, 'Mercado Pago');
                        showToast(result.error ?? 'Pago acreditado con Mercado Pago.');
                      }}
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Paginacion {...paginacion} />
    </>
  );
}
