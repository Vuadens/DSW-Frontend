import { useUiStore } from '../../stores/uiStore';

export function Toast() {
  const toast = useUiStore((s) => s.toast);
  return (
    <div role="status" aria-live="polite">
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
