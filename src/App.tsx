import { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { useAuthStore } from './stores/authStore';
import { useDataStore } from './stores/dataStore';
import { useUiStore } from './stores/uiStore';

function App() {
  const hydrate = useDataStore((state) => state.hydrate);
  const restore = useAuthStore((state) => state.restore);
  const session = useAuthStore((state) => state.session);
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    void restore();
  }, [restore]);

  // En modo conectado los datos dependen del rol: se cargan al iniciar sesión.
  useEffect(() => {
    if (!session) return;
    void hydrate(session.role).then((result) => {
      if (result.error) showToast(result.error);
    });
  }, [session, hydrate, showToast]);

  return <AppRouter />;
}

export default App;
