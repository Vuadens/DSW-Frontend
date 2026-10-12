import { PageHeader, Pill } from '../../components/common/Tile';
import { fmt, longDate } from '../../lib/format';
import { ESTADO_CUOTA_LABEL, estadoCuota, periodoLabel } from '../../lib/rules';
import { useCurrentUser } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

export default function MisCuotasPage() {
  const user = useCurrentUser();
  const cuotas = useDataStore((s) => s.cuotas);
  const pagarCuota = useDataStore((s) => s.pagarCuota);
  const showToast = useUiStore((s) => s.showToast);

  const propias = cuotas
    .filter((c) => c.idSocio === user?.id)
    .sort((a, b) => b.fechaVencimiento.localeCompare(a.fechaVencimiento));

  return (
    <>
      <PageHeader title="Mis cuotas" lede="Pagá online y descargá tu historial." />
      {propias.length === 0 ? (
        <p className="none">No tenés cuotas generadas.</p>
      ) : (
        <div className="rows flush">
          {propias.map((c) => {
            const estado = estadoCuota(c);
            return (
              <div key={c.id} className="row">
                <div>
                  <h3>{periodoLabel(c.periodo)}</h3>
                  <small>{c.nroComprobante}</small>
                  <small>
                    {c.fechaPago
                      ? `Pagada el ${longDate(c.fechaPago)} con ${c.metodoPago}`
                      : `Vence el ${longDate(c.fechaVencimiento)}`}
                  </small>
                </div>
                <span className="a">{fmt(c.valor)}</span>
                <div className="rb">
                  <Pill kind={estado === 'pagada' ? 'ok' : estado === 'vencida' ? 'mora' : undefined}>
                    {ESTADO_CUOTA_LABEL[estado]}
                  </Pill>
                  {estado !== 'pagada' && (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => {
                        pagarCuota(c.id, 'Mercado Pago');
                        showToast('Pago acreditado con Mercado Pago.');
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
    </>
  );
}
