import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthStoreState {
  token?: string;
  user?: AuthUser;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'querydash.auth';

export const useAuthStore = create<AuthStoreState>((set) => ({
  hydrated: false,
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
        set({ user: parsed.user, token: parsed.token, hydrated: true });
        return;
      }
    } catch {
      // corrupted storage; fall through to unauthenticated state
    }
    set({ hydrated: true });
  },
  setSession: (user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    }
    set({ user, token, hydrated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ user: undefined, token: undefined });
  },
}));
