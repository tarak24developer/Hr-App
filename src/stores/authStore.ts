import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true, // Start with loading true
      error: null,

      setUser: (user) => set({ user, error: null, loading: false }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error, loading: false }),
      
      clearAuth: () => set({ user: null, loading: false, error: null }),
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      
      logout: async () => {
        try {
          await authService.logout();
          set({ user: null, loading: false, error: null });
        } catch (error) {
          console.error('Logout error:', error);
          // Even if logout fails, clear local state
          set({ user: null, loading: false, error: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Action hooks
export const useAuthActions = () => useAuthStore((state) => ({
  setUser: state.setUser,
  setLoading: state.setLoading,
  setError: state.setError,
  clearAuth: state.clearAuth,
  updateUser: state.updateUser,
  logout: state.logout,
}));
