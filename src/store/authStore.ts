import { create } from "zustand";

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type AuthState = {
    user: User | null;
    token: string | null;

    setAuth: (user: User, token: string) => void;
    loadFromStorage: () => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,

    setAuth: (user, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        set({ user, token });
    },

    loadFromStorage: () => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (token && user) {
            set({
                token,
                user: JSON.parse(user),
            });
        }
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        set({ user: null, token: null });
    },
}));