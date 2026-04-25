import { create } from "zustand";

export type AuthRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type AuthUser = {
  userId: string;
  tenantId: string;
  role: AuthRole;
  // These are populated from /api/auth/me enriched response
  name?: string;
  email?: string;
};

type AuthState = {
  user: AuthUser | null;
  // Flat permission map: { "TASKS.READ": true, "USERS.WRITE": false, ... }
  permissions: Record<string, boolean>;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  // Check if the current user has a given permission (client-side, from cached map)
  canAccess: (module: string, action: string) => boolean;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: {},
  isLoading: true,

  setUser: (user) => set({ user }),

  canAccess: (module, action) => {
    return get().permissions[`${module}.${action}`] ?? false;
  },

  initAuth: async () => {
    try {
      set({ isLoading: true });

      const [meRes, permRes] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/permissions/me", { credentials: "include" }),
      ]);

      if (meRes.ok) {
        const meJson = await meRes.json();
        const permJson = permRes.ok ? await permRes.json() : { data: {} };

        set({
          user: meJson.data,
          permissions: permJson.data ?? {},
          isLoading: false,
        });
      } else {
        set({ user: null, permissions: {}, isLoading: false });
      }
    } catch {
      set({ user: null, permissions: {}, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      set({ user: null, permissions: {} });
    }
  },
}));
