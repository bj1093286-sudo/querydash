import { useAuthStore } from '../store/authStore';

/** Reads the current token fresh on every call, for hooks that make their own raw fetch() calls outside api.ts. */
export function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
