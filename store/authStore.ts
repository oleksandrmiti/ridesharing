import { create } from 'zustand';
import type { User } from 'firebase/auth';

type AuthState = {
  user: User | null;
  initializing: boolean;
  profileCompleted: boolean | null;
  setUser: (user: User | null) => void;
  setInitializing: (v: boolean) => void;
  setProfileCompleted: (v: boolean | null) => void;
  isLoggedIn: () => boolean;
  isEmailVerified: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initializing: true,
  profileCompleted: null,
  setUser: (user) => set({ user }),
  setInitializing: (v) => set({ initializing: v }),
  setProfileCompleted: (v) => set({ profileCompleted: v }),
  isLoggedIn: () => !!get().user,
  isEmailVerified: () => !!get().user?.emailVerified,
}));
