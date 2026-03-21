import { create } from "zustand";

type Task = {
    id: string;
    title: string;
    status: string;
};

type TaskState = {
    tasks: Task[];
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

    resetTasks: () =>
        set({
            tasks: [],
            page: 1,
            hasMore: true,
        }),

    fetchTasks: async () => {
        const { page, tasks } = get();

        set({ loading: true });

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`/api/tasks?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            // handle both formats (array or { tasks })
            const newTasks = data.tasks || data;

            // remove duplicates
            const uniqueTasks = newTasks.filter(
                (t: Task) => !tasks.some((e) => e.id === t.id)
            );

            set({
                tasks: [...tasks, ...uniqueTasks],
                page: page + 1,
                hasMore: newTasks.length > 0,
            });
        } catch (err) {
            console.error(err);
        } finally {
            set({ loading: false });
        }
    },
}));