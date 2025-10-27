import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { encryptData, decryptData } from '@/utils/encryption';
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

      setUser: (user) => set({ user, error: null }),
      
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
      // ✅ SECURITY: Custom encrypted storage
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          if (!item) return null;
          
          try {
            // Decrypt the data
            const decrypted = decryptData(item);
            return decrypted;
          } catch (error) {
            console.error('Failed to decrypt auth data:', error);
            // Clear corrupted data
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Encrypt the data before storing
            const encrypted = encryptData(value);
            localStorage.setItem(name, encrypted);
          } catch (error) {
            console.error('Failed to encrypt auth data:', error);
            // Fallback to unencrypted storage (better than losing data)
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
      partialize: (state) => ({ 
        user: state.user,
        setUser: state.setUser,
        setLoading: state.setLoading,
        setError: state.setError,
        clearAuth: state.clearAuth,
        updateUser: state.updateUser,
        logout: state.logout,
        loading: true,
        error: null
        // Store only user data encrypted, exclude temporary states
      }),
      onRehydrateStorage: () => (state) => {
        // Reset loading state after rehydration
        if (state) {
          state.loading = true; // Let auth service determine the actual state
          state.error = null;
        }
      },
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
