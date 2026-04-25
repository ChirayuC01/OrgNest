import { create } from "zustand";

export type Task = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    assignedToId: string | null;
    assignedUser: { id: string; name: string; email: string } | null;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
};

type TaskState = {
    tasks: Task[];
    nextCursor: string | null;
    totalCount: number;
    loading: boolean;
    error: string | null;

    fetchTasks: (queryString?: string) => Promise<void>;
    fetchMore: (queryString?: string) => Promise<void>;
    resetTasks: () => void;
    updateTaskInStore: (task: Task) => void;
    removeTaskFromStore: (id: string) => void;
    addTaskToStore: (task: Task) => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks:      [],
    nextCursor: null,
    totalCount: 0,
    loading:    false,
    error:      null,

    resetTasks: () => set({ tasks: [], nextCursor: null, totalCount: 0, error: null }),

    fetchTasks: async (queryString = "") => {
        set({ loading: true, error: null, tasks: [], nextCursor: null });
        try {
            const res  = await fetch(`/api/tasks?${queryString}`, { credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");
            set({
                tasks:      data.data.tasks,
                nextCursor: data.data.nextCursor,
                totalCount: data.data.totalCount,
            });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : "Failed to load tasks" });
        } finally {
            set({ loading: false });
        }
    },

    fetchMore: async (queryString = "") => {
        const { nextCursor, tasks, loading } = get();
        if (!nextCursor || loading) return;

        set({ loading: true });
        try {
            const qs   = queryString ? `${queryString}&cursor=${nextCursor}` : `cursor=${nextCursor}`;
            const res  = await fetch(`/api/tasks?${qs}`, { credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to load more tasks");
            set((s) => ({
                tasks:      [...s.tasks, ...data.data.tasks],
                nextCursor: data.data.nextCursor,
                totalCount: data.data.totalCount,
            }));
        } catch (err) {
            set({ error: err instanceof Error ? err.message : "Failed to load tasks" });
        } finally {
            set({ loading: false });
        }
    },

    updateTaskInStore: (task) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === task.id ? task : t)) })),

    removeTaskFromStore: (id) =>
        set((s) => ({
            tasks:      s.tasks.filter((t) => t.id !== id),
            totalCount: s.totalCount - 1,
        })),

    addTaskToStore: (task) =>
        set((s) => ({ tasks: [task, ...s.tasks], totalCount: s.totalCount + 1 })),
}));
