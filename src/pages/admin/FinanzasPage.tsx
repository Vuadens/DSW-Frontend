import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Pill, Tile } from '../../components/common/Tile';
import { fmt, fullName, PERIODO_ACTUAL } from '../../lib/format';
import { estadoCuota } from '../../lib/rules';
import { useDataStore } from '../../stores/dataStore';

export default function FinanzasPage() {
  const { cuotas, socios, profesores } = useDataStore();
  const ingresos = cuotas.filter((c) => c.fechaPago?.startsWith(PERIODO_ACTUAL)).reduce((sum, c) => sum + c.valor, 0);
  const egresos = profesores.reduce((sum, p) => sum + (p.sueldos[p.sueldos.length - 1]?.valor ?? 0), 0);
  const pendientes = cuotas.filter((c) => estadoCuota(c) !== 'pagada');
  const socio = (id: number) => socios.find((s) => s.id === id);
  const filas = useMemo(() => [...cuotas].sort((a, b) => b.fechaVencimiento.localeCompare(a.fechaVencimiento)), [cuotas]);

  return (
    <>
      <PageHeader title="Finanzas." lede={`Tenés ${fmt(pendientes.reduce((sum, c) => sum + c.valor, 0))} por cobrar.`} />
      <div className="finance-cards">
        <Tile tone="blue"><small>Ingresos del mes</small><span className="num">{fmt(ingresos)}</span></Tile>
        <Tile tone="red"><small>Egresos del mes</small><span className="num">{fmt(egresos)}</span><p>Docentes y reparaciones.</p></Tile>
        <Tile tone="green"><small>Resultado neto</small><span className="num">{fmt(ingresos - egresos)}</span><p>Ingresos menos egresos.</p></Tile>
      </div>
      <div className="finance-section">
        <div className="finance-heading"><h2>Cobranzas</h2><Link className="btn line sm" to="/app/socios">Ver socios</Link></div>
        <div className="finance-list">
          {filas.map((cuota) => {
            const member = socio(cuota.idSocio);
            const status = estadoCuota(cuota);
            return <div className="finance-row" key={cuota.id}>
              <div><h3>{member ? fullName(member.nombre, member.apellido) : 'Socio eliminado'}</h3><small>#{cuota.nroComprobante} · período {cuota.periodo}{cuota.fechaPago ? ` · pagada con ${cuota.metodoPago}` : ''}</small></div>
              <div className="finance-actions"><strong>{fmt(cuota.valor)}</strong><Pill kind={status === 'pagada' ? 'ok' : status === 'vencida' ? 'mora' : undefined}>{status === 'pagada' ? 'Pagada' : status === 'vencida' ? 'Vencida' : 'Pendiente'}</Pill>{status !== 'pagada' && <Link className="btn sm" to="/app/socios">Cobrar</Link>}</div>
            </div>;
          })}
        </div>
      </div>
    </>
  );
}


