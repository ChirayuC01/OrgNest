import { create } from "zustand";

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type UserState = {
    users: User[];
    loading: boolean;

    fetchUsers: () => Promise<void>;
    addUser: (user: User) => void;
};

export const useUserStore = create<UserState>((set) => ({
    users: [],
    loading: false,

    fetchUsers: async () => {
        set({ loading: true });

        try {
            const token = localStorage.getItem("token");

            const res = await fetch("/api/users", {
                headers: {
                    // Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            const data = await res.json();

            set({ users: data });
        } catch (err) {
            console.error(err);
        } finally {
            set({ loading: false });
        }
    },

    addUser: (user) =>
        set((state) => ({
            users: [...state.users, user],
        })),
}));