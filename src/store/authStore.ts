import { create } from "zustand";

export type PermissionMap = Record<string, Record<string, boolean>>;

export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: PermissionMap;
};

type AuthState = {
    user: User | null;
    setAuth: (user: User) => void;
    loadFromStorage: () => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,

    setAuth: (user) => {
        localStorage.setItem("user", JSON.stringify(user));
        set({ user });
    },

    loadFromStorage: () => {
        const raw = localStorage.getItem("user");
        if (raw) {
            try {
                set({ user: JSON.parse(raw) });
            } catch {
                localStorage.removeItem("user");
            }
        }
    },

    logout: () => {
        localStorage.removeItem("user");
        set({ user: null });
    },
}));
