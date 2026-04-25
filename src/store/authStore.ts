import { create } from "zustand";

export type AuthRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  tenantId: string;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        set({ user: json.data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      set({ user: null });
    }
  },
}));
