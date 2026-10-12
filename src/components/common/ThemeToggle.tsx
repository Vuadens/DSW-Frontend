import { useUiStore } from '../../stores/uiStore';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useUiStore((state) => state.theme);
  const cycleTheme = useUiStore((state) => state.cycleTheme);
  const label = theme === 'dark' ? 'Modo claro' : theme === 'light' ? 'Modo sistema' : 'Modo oscuro';

  return (
    <button type="button" className={`theme-toggle${compact ? ' compact' : ''}`} onClick={cycleTheme} aria-label={`Cambiar tema. Próximo: ${label}`}>
      <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
      {!compact && <span>{theme === 'dark' ? 'Claro' : theme === 'light' ? 'Sistema' : 'Oscuro'}</span>}
    </button>
  );
}
