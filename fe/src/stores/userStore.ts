import { create } from 'zustand';
import type { AuthUser } from '@/types/auth_user';

interface UserStore {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => {
    set({ user: null });
  },
}));