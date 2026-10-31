import { useMemo, useState } from 'react';
import { Dialog } from '../../components/common/Dialog';
import { Paginacion, usePaginacion } from '../../components/common/Paginacion';
import { PageHeader, Pill, Tile } from '../../components/common/Tile';
import { MODULOS_DEMO } from '../../lib/features';
import { PERIODO_ACTUAL, fmt, fullName, longDate, normalizar } from '../../lib/format';
import { ESTADO_CUOTA_LABEL, cuotasConPendientes, estadoCuota, periodoLabel } from '../../lib/rules';
import type { Cuota, EstadoCuota, MetodoPago } from '../../models';
import { useDataStore } from '../../stores/dataStore';
import { useUiStore } from '../../stores/uiStore';

type Filtro = 'todas' | EstadoCuota;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'vencida', label: 'En mora' },
  { id: 'pagada', label: 'Pagadas' },
];

const METODOS: MetodoPago[] = ['Efectivo', 'Transferencia', 'Mercado Pago'];

export default function CuotasAdminPage() {
  const cuotas = useDataStore((s) => s.cuotas);
  const socios = useDataStore((s) => s.socios);
  const planes = useDataStore((s) => s.planes);
  const pagarCuota = useDataStore((s) => s.pagarCuota);
  const generarCuotas = useDataStore((s) => s.generarCuotas);
  const showToast = useUiStore((s) => s.showToast);

  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);
  const [query, setQuery] = useState('');
  const [paying, setPaying] = useState<Cuota | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo');

  // En modo conectado se trabaja mes a mes: lo adeudado se calcula para el período elegido.
  const delPeriodo = useMemo(
    () =>
      MODULOS_DEMO
        ? cuotas
        : cuotasConPendientes(cuotas, socios, planes, periodo).filter((c) => c.periodo === periodo),
    [cuotas, socios, planes, periodo],
  );

  const totals = useMemo(() => {
    const sum = (estado: EstadoCuota) =>
      delPeriodo.filter((c) => estadoCuota(c) === estado).reduce((acc, c) => acc + c.valor, 0);
    return { pagada: sum('pagada'), pendiente: sum('pendiente'), vencida: sum('vencida') };
  }, [delPeriodo]);

  const nombreSocio = (id: number) => {
    const s = socios.find((x) => x.id === id);
    return s ? fullName(s.nombre, s.apellido) : 'Socio eliminado';
  };

  const visible = useMemo(() => {
    const q = normalizar(query.trim());
    return delPeriodo
      .filter((c) => filtro === 'todas' || estadoCuota(c) === filtro)
      .filter((c) => {
        const socio = socios.find((s) => s.id === c.idSocio);
        return normalizar(`${socio?.nombre} ${socio?.apellido} ${socio?.dni}`).includes(q);
      })
      .sort((a, b) => b.fechaVencimiento.localeCompare(a.fechaVencimiento));
  }, [delPeriodo, filtro, query, socios]);

  const { visibles, paginacion } = usePaginacion(visible, `${filtro}|${periodo}|${query}`);

  return (
    <>
      <PageHeader
        title="Cuotas"
        lede="Cobros, vencimientos y mora."
        actions={
          MODULOS_DEMO ? (
            <button
              type="button"
              className="btn sm"
              onClick={() => {
                const n = generarCuotas();
                showToast(n ? `Se generaron ${n} cuotas de noviembre.` : 'Las cuotas de noviembre ya estaban generadas.');
              }}
            >
              Generar cuotas de noviembre
            </button>
          ) : undefined
        }
      />
      <div className="tiles">
        <Tile tone="green">
          <h3>Cobrado</h3>
          <span className="num">{fmt(totals.pagada)}</span>
        </Tile>
        <Tile tone="yellow">
          <h3>Pendiente</h3>
          <span className="num">{fmt(totals.pendiente)}</span>
        </Tile>
        <Tile tone="red">
          <h3>En mora</h3>
          <span className="num">{fmt(totals.vencida)}</span>
        </Tile>
      </div>

      <div className="hfilter">
        <input
          type="search"
          placeholder="Buscar por socio o DNI"
          aria-label="Buscar por socio o DNI"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {!MODULOS_DEMO && (
          <input
            type="month"
            aria-label="Mes"
            max={PERIODO_ACTUAL}
            value={periodo}
            onChange={(event) => event.target.value && setPeriodo(event.target.value)}
          />
        )}
      </div>

      <div className="tabs sec" role="group" aria-label="Filtrar cuotas">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="none">No hay cuotas en este estado.</p>
      ) : (
        <div className="rows flush">
          {visibles.map((c) => {
            const estado = estadoCuota(c);
            return (
              <div key={c.id} className="row">
                <div>
                  <h3>{nombreSocio(c.idSocio)}</h3>
                  <small>
                    {periodoLabel(c.periodo)}
                    {c.nroComprobante ? ` · ${c.nroComprobante}` : ''}
                  </small>
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
                  {estado !== 'pagada' && (
                    <button type="button" className="btn line sm" onClick={() => setPaying(c)}>
                      Registrar pago
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Paginacion {...paginacion} />

      <Dialog open={paying !== null} onClose={() => setPaying(null)} variant="modal" label="Registrar pago">
        <h2>Registrar pago</h2>
        {paying && (
          <p className="lede" style={{ marginTop: 0 }}>
            {nombreSocio(paying.idSocio)} · {periodoLabel(paying.periodo)} · {fmt(paying.valor)}
          </p>
        )}
        {MODULOS_DEMO && (
          <div className="fld">
            <label htmlFor="metodo">Método de pago</label>
            <select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="acts">
          <button type="button" className="btn line sm" onClick={() => setPaying(null)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn sm"
            onClick={async () => {
              if (!paying) return;
              const result = await pagarCuota(paying, metodo);
              showToast(result.error ?? 'Pago registrado.');
              setPaying(null);
            }}
          >
            Confirmar pago
          </button>
        </div>
      </Dialog>
    </>
  );
}
