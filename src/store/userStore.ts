import { create } from "zustand";

export type OrgUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
};

type UserState = {
    users: OrgUser[];
    loading: boolean;
    error: string | null;

    fetchUsers: () => Promise<void>;
    addUser: (user: OrgUser) => void;
    removeUser: (id: string) => void;
};

export const useUserStore = create<UserState>((set) => ({
    users:   [],
    loading: false,
    error:   null,

    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const res  = await fetch("/api/users", { credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to load users");
            set({ users: data.data ?? [] });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : "Failed to load users" });
        } finally {
            set({ loading: false });
        }
    },

    addUser: (user) => set((s) => ({ users: [...s.users, user] })),

    removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
}));
