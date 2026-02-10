import { create } from 'zustand';
import type { User } from 'firebase/auth';

type AuthState = {
  user: User | null;
  initializing: boolean;
  profileCompleted: boolean | null;
  setUser: (user: User | null) => void;
  setInitializing: (v: boolean) => void;
  isLoggedIn: () => boolean;
  isEmailVerified: () => boolean;
  setProfileCompleted: (v: boolean | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  profileCompleted: false,
  setUser: (user) => set({ user }),
  setInitializing: (v) => set({ initializing: v }),
  isLoggedIn: () => !!get().user,
  isEmailVerified: () => !!get().user?.emailVerified,
  setProfileCompleted: (v) => set({ profileCompleted: v }),
}));