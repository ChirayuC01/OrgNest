import { create } from "zustand";

export type StoreUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserState = {
  users: StoreUser[];
  loading: boolean;

  fetchUsers: () => Promise<void>;
  addUser: (user: StoreUser) => void;
};

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      const json = await res.json();
      set({ users: json.data ?? [] });
    } catch {
      // silently fail — middleware will handle auth errors
    } finally {
      set({ loading: false });
    }
  },

  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
}));
