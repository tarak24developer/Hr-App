import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'auto';
  isDark: boolean;
}

interface ThemeActions {
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      isDark: false,

      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
          set({ isDark: true });
        } else {
          document.documentElement.classList.remove('dark');
          set({ isDark: false });
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      setDarkMode: (isDark) => {
        set({ isDark });
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const theme = useThemeStore.getState().theme;
  useThemeStore.getState().setTheme(theme);
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme } = useThemeStore.getState();
    if (theme === 'auto') {
      useThemeStore.getState().setDarkMode(e.matches);
    }
  });
}

// Selector hooks
export const useTheme = () => useThemeStore((state) => state.theme);
export const useIsDark = () => useThemeStore((state) => state.isDark);

// Action hooks
export const useThemeActions = () => useThemeStore((state) => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
  setDarkMode: state.setDarkMode,
}));
