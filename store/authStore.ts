import { create } from 'zustand';
import type { User } from 'firebase/auth';

type AuthState = {
  user: User | null;
  initializing: boolean;
  setUser: (user: User | null) => void;
  setInitializing: (v: boolean) => void;
  isLoggedIn: () => boolean;
  isEmailVerified: () => boolean;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user }),
  setInitializing: (v) => set({ initializing: v }),

  isLoggedIn: () => !!get().user,
  isEmailVerified: () => !!get().user?.emailVerified,
}));