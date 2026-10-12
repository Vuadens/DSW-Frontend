import { Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { Tile } from '../components/common/Tile';
import { fmt } from '../lib/format';
import { useCurrentUser } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';

const BLOCKS = ['var(--orange)', 'var(--green)', 'var(--purple)', 'var(--blue)'];

export default function LandingPage() {
  const user = useCurrentUser();
  const planes = useDataStore((state) => state.planes);

  return (
    <div className="w">
      <header className="ln">
        <Logo />
        <nav className="row2" aria-label="Acceso">
          <Link to={user ? '/app' : '/ingresar'} className="btn line sm">
            {user ? 'Mi panel' : 'Ingresar'}
          </Link>
          {!user && <Link to="/registro" className="btn sm">Crear cuenta</Link>}
        </nav>
      </header>
      <main>
        <section className="hero">
          <h1>Entrená sin vueltas.</h1>
          <p className="lede">Reservá clases, pagá tus cuotas y seguí tu plan desde un solo lugar.</p>
          <div className="row2">
            <Link to="/registro" className="btn">
              Quiero asociarme
            </Link>
            <Link to="/ingresar" className="btn line">
              Ya soy socio
            </Link>
          </div>
        </section>
        <div className="col" aria-hidden="true">
          {BLOCKS.map((color) => (
            <div key={color} style={{ background: color }} />
          ))}
        </div>
        <section className="sp plans-home">
          <h2>Elegí tu plan.</h2>
          <p className="lede">Pagás online con Mercado Pago y empezás el mismo día.</p>
          <div className="tiles plans-grid">
            {planes.map((plan, index) => (
              <Tile key={plan.id} tone={(['purple', 'blue', 'green'] as const)[index % 3]}>
                <h3>{plan.nombre}</h3>
                <span className="num">{fmt(plan.precio)}</span>
                <p>por mes</p>
                <Link to={user ? '/app' : '/registro'} className="btn">Elegir plan</Link>
              </Tile>
            ))}
          </div>
        </section>
        <section className="sp">
          <h2>Todo el gimnasio en un panel.</h2>
          <p className="lede">
            Socios reservan, profesores toman asistencia y administración controla cobros, máquinas y planes.
          </p>
        </section>
        <section className="cta">
          <h2>Tu primera clase te espera.</h2>
          <Link to="/registro" className="btn">
            Crear cuenta gratis
          </Link>
        </section>
      </main>
    </div>
  );
}
