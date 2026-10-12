import { create } from 'zustand';

export type Theme = 'system' | 'light' | 'dark';

interface UiState {
  theme: Theme;
  toast: string | null;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  showToast: (message: string) => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'system',
  toast: null,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  cycleTheme: () => {
    const order: Theme[] = ['system', 'light', 'dark'];
    get().setTheme(order[(order.indexOf(get().theme) + 1) % order.length]);
  },
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 3200);
  },
}));
