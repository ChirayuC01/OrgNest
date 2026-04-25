import { create } from "zustand";

export type StoreTask = {
  id: string;
  title: string;
  status: string;
};

type TaskState = {
  tasks: StoreTask[];
  page: number;
  hasMore: boolean;
  loading: boolean;

  fetchTasks: () => Promise<void>;
  resetTasks: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  page: 1,
  hasMore: true,
  loading: false,

  resetTasks: () => set({ tasks: [], page: 1, hasMore: true }),

  fetchTasks: async () => {
    const { page, tasks } = get();
    set({ loading: true });

    try {
      const res = await fetch(`/api/tasks?page=${page}`, { credentials: "include" });
      const json = await res.json();

      const newTasks: StoreTask[] = json.data ?? [];

      const uniqueTasks = newTasks.filter((t) => !tasks.some((e) => e.id === t.id));

      set({
        tasks: [...tasks, ...uniqueTasks],
        page: page + 1,
        hasMore: newTasks.length > 0,
      });
    } catch {
      // silently fail
    } finally {
      set({ loading: false });
    }
  },
}));
