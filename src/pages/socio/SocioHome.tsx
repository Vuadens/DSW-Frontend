import { Link } from 'react-router-dom';
import { PageHeader, Pill, Tile, TileFooter } from '../../components/common/Tile';
import { PERIODO_ACTUAL, fmt, longDate, TODAY } from '../../lib/format';
import { ESTADO_CUOTA_LABEL, clasesDelPeriodo, estadoCuota, periodoLabel } from '../../lib/rules';
import { useCurrentUser } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';

export default function SocioHome() {
  const user = useCurrentUser();
  const socio = useDataStore((s) => s.socios.find((x) => x.id === user?.id));
  const plan = useDataStore((s) => s.planes.find((p) => p.id === socio?.idPlan));
  const cuotas = useDataStore((s) => s.cuotas);
  const inscripciones = useDataStore((s) => s.inscripciones);
  const clases = useDataStore((s) => s.clases);
  const actividades = useDataStore((s) => s.actividades);

  if (!socio || !user) return null;

  const usadas = clasesDelPeriodo(socio.id, inscripciones);
  const limite = plan?.clasesPorPeriodo ?? null;
  const propias = cuotas.filter((c) => c.idSocio === socio.id);
  const actual = propias.find((c) => c.periodo === PERIODO_ACTUAL);
  const mora = propias.filter((c) => estadoCuota(c) === 'vencida');
  const proxima = inscripciones
    .filter((i) => i.idSocio === socio.id && i.estado === 'Confirmada' && i.fechaClase >= TODAY)
    .sort((a, b) => a.fechaClase.localeCompare(b.fechaClase))[0];
  const proximaClase = clases.find((c) => c.id === proxima?.idClase);
  const proximaActividad = actividades.find((a) => a.id === proximaClase?.idActividad);

  return (
    <>
      <PageHeader eyebrow={longDate(TODAY)} title={`Hola, ${user.nombre}`} lede="Tu entrenamiento de este mes." />
      <div className="tiles">
        <Tile tone="purple" mine>
          <h3>{plan ? plan.nombre : 'Sin plan'}</h3>
          <span className="num">{plan ? fmt(plan.precio) : '-'}</span>
          <p>{limite ? `${limite} clases por mes` : plan ? 'Clases ilimitadas' : 'Consultá en recepción.'}</p>
        </Tile>
        <Tile tone="orange">
          <h3>Clases del mes</h3>
          <span className="num">{limite ? `${usadas} de ${limite}` : usadas}</span>
          {limite && (
            <div className="bar" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (usadas / limite) * 100)}%` }} />
            </div>
          )}
          <TileFooter>
            <Link to="/app/clases" className="btn sm">
              Reservar clase
            </Link>
          </TileFooter>
        </Tile>
        <Tile tone={mora.length ? 'red' : 'green'}>
          <h3>Cuota de octubre</h3>
          <span className="num">{actual ? ESTADO_CUOTA_LABEL[estadoCuota(actual)] : 'Sin cuota'}</span>
          <p>
            {mora.length
              ? `Tenés ${mora.length} cuota${mora.length > 1 ? 's' : ''} en mora.`
              : actual
                ? `${periodoLabel(actual.periodo)} · ${fmt(actual.valor)}`
                : 'No hay cuota generada.'}
          </p>
          <TileFooter>
            <Link to="/app/cuotas" className="btn sm">
              Ver cuotas
            </Link>
          </TileFooter>
        </Tile>
        <Tile tone="blue">
          <h3>Próxima clase</h3>
          <span className="num">{proximaActividad?.nombre ?? 'Ninguna'}</span>
          <p>
            {proximaClase && proxima ? (
              <>
                {longDate(proxima.fechaClase)} · {proximaClase.desde} <Pill kind="ok">Confirmada</Pill>
              </>
            ) : (
              'Todavía no reservaste.'
            )}
          </p>
        </Tile>
      </div>
    </>
  );
}
