import { useEffect } from 'react';
import { actualizarHoy } from './lib/format';
import { AppRouter } from './routes/AppRouter';
import { useAuthStore } from './stores/authStore';
import { useDataStore } from './stores/dataStore';
import { useUiStore } from './stores/uiStore';

function App() {
  const hydrate = useDataStore((state) => state.hydrate);
  const restore = useAuthStore((state) => state.restore);
  const session = useAuthStore((state) => state.session);
  const debeCambiarPassword = useAuthStore((state) => state.debeCambiarPassword);
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    void restore();
  }, [restore]);

  // En modo conectado los datos dependen del rol: se cargan al iniciar sesión.
  // Con la contraseña inicial el backend no entrega datos: se espera a que la cambie.
  useEffect(() => {
    if (!session || debeCambiarPassword) return;
    void hydrate(session.role).then((result) => {
      if (result.error) showToast(result.error);
    });
  }, [session, debeCambiarPassword, hydrate, showToast]);

  // Al cambiar el día se recargan los datos: así las clases muestran su próxima fecha
  // y no la de un día que ya pasó.
  useEffect(() => {
    if (!session || debeCambiarPassword) return;
    const id = window.setInterval(() => {
      if (actualizarHoy()) void hydrate(session.role);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [session, debeCambiarPassword, hydrate]);

  return <AppRouter />;
}

export default App;
