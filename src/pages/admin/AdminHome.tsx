import { Link } from 'react-router-dom';
import { PageHeader, Tile, TileFooter } from '../../components/common/Tile';
import { PERIODO_ACTUAL, fmt, longDate, TODAY } from '../../lib/format';
import { estadoCuota } from '../../lib/rules';
import { useDataStore } from '../../stores/dataStore';

export default function AdminHome() {
  const { cuotas, socios, profesores, maquinas, clases, planes } = useDataStore();

  const ingresos = cuotas.filter((c) => c.fechaPago?.startsWith(PERIODO_ACTUAL)).reduce((a, c) => a + c.valor, 0);
  const egresos = profesores.reduce((a, p) => a + (p.sueldos[p.sueldos.length - 1]?.valor ?? 0), 0);
  const mora = cuotas.filter((c) => estadoCuota(c) === 'vencida');
  const activos = socios.filter((s) => !s.fechaBaja);
  const sinServicio = maquinas.filter((m) => m.estado !== 'ok');

  return (
    <>
      <PageHeader eyebrow={longDate(TODAY)} title="Resumen" lede="El estado del gimnasio de un vistazo." />
      <div className="tiles">
        <Tile tone="green">
          <h3>Ingresos del mes</h3>
          <span className="num">{fmt(ingresos)}</span>
          <p>Cuotas cobradas en octubre.</p>
        </Tile>
        <Tile tone="purple">
          <h3>Sueldos</h3>
          <span className="num">{fmt(egresos)}</span>
          <p>{profesores.length} profesores en nómina.</p>
        </Tile>
        <Tile tone={ingresos - egresos >= 0 ? 'blue' : 'red'}>
          <h3>Balance</h3>
          <span className="num">{fmt(ingresos - egresos)}</span>
          <p>Ingresos menos sueldos.</p>
        </Tile>
        <Tile tone="orange">
          <h3>Socios activos</h3>
          <span className="num">{activos.length}</span>
          <p>
            {socios.length - activos.length} dados de baja · {planes.length} planes.
          </p>
          <TileFooter>
            <Link to="/app/socios" className="btn sm">
              Ver socios
            </Link>
          </TileFooter>
        </Tile>
        <Tile tone="red">
          <h3>Cuotas en mora</h3>
          <span className="num">{mora.length}</span>
          <p>{fmt(mora.reduce((a, c) => a + c.valor, 0))} pendientes de cobro vencido.</p>
          <TileFooter>
            <Link to="/app/cuotas" className="btn sm">
              Gestionar cobros
            </Link>
          </TileFooter>
        </Tile>
        <Tile tone="yellow">
          <h3>Máquinas con aviso</h3>
          <span className="num">{sinServicio.length}</span>
          <p>{clases.length} clases semanales programadas.</p>
          <TileFooter>
            <Link to="/app/maquinas" className="btn sm">
              Ver máquinas
            </Link>
          </TileFooter>
        </Tile>
      </div>
    </>
  );
}
