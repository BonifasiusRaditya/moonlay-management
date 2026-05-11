import { create } from 'zustand';
import type { AuthUser } from '@/types/auth_user';
import { apiClient } from '@/api/client';
import Cookie from 'js-cookie';
import api from './axios';

interface UserStore {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
}));

type MeResponse = {
  user?: AuthUser;
  data?: {
    user?: AuthUser;
  } & AuthUser;
} & AuthUser;

let pendingSessionRequest: Promise<AuthUser | null> | null = null;

function normalizeAuthUser(payload: MeResponse): AuthUser | null {
  const candidate = payload?.data?.user ?? payload?.user ?? payload?.data ?? payload;
  if (!candidate || typeof candidate !== 'object' || !('id' in candidate)) {
    return null;
  }

  return {
    id: Number(candidate.id),
    name: String(candidate.name ?? ''),
    email: String(candidate.email ?? ''),
    role: String(candidate.role ?? ''),
    client_id: candidate.client_id,
    branch_id: candidate.branch_id,
    must_change_password: candidate.must_change_password,
    permissions: Array.isArray(candidate.permissions) ? candidate.permissions : [],
  };
}

export async function refreshAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<MeResponse>('/auth/me');
    const user = normalizeAuthUser(response.data);
    if (!user) {
      useUserStore.getState().clearUser();
      return null;
    }

    useUserStore.getState().setUser(user);
    return user;
  } catch {
    useUserStore.getState().clearUser();
    return null;
  }
}

export async function ensureAuthenticatedUser(): Promise<AuthUser | null> {
  const cachedUser = useUserStore.getState().user;
  if (cachedUser) {
    return cachedUser;
  }

  if (!pendingSessionRequest) {
    pendingSessionRequest = refreshAuthenticatedUser().finally(() => {
      pendingSessionRequest = null;
    });
  }

  return pendingSessionRequest;
}