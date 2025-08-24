import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

interface FontSizeState {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  resetFontSize: () => void;
}

const defaultFontSize: FontSize = 'base';

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set) => ({
      fontSize: defaultFontSize,
      setFontSize: (size: FontSize) => set({ fontSize: size }),
      resetFontSize: () => set({ fontSize: defaultFontSize }),
    }),
    {
      name: 'font-size-storage',
    }
  )
);
