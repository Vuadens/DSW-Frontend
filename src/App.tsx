import { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { useDataStore } from './stores/dataStore';
import { useUiStore } from './stores/uiStore';

function App() {
  const hydrate = useDataStore((state) => state.hydrate);
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    void hydrate().then((result) => {
      if (result.error) showToast(result.error);
    });
  }, [hydrate, showToast]);

  return <AppRouter />;
}

export default App;
