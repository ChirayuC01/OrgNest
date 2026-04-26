"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, fetchPaginated } from "@/lib/api";
import type { Task, TaskStatus } from "@/types";
import type { PaginatedResponse } from "@/types";
import { toast } from "sonner";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: string) => ["tasks", "list", params] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

// ─── Single task ──────────────────────────────────────────────────────────────

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: taskId ? taskKeys.detail(taskId) : ["tasks", "detail", "none"],
    queryFn: () => api.get<import("@/types").Task>(`/api/tasks/${taskId}`),
    enabled: !!taskId,
  });
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function useTasks(params: URLSearchParams) {
  const key = params.toString();
  return useQuery<PaginatedResponse<Task>>({
    queryKey: taskKeys.list(key),
    queryFn: () => fetchPaginated<Task>(`/api/tasks?${key}`),
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: string;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => api.post<Task>("/api/tasks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

interface UpdateTaskInput {
  id: string;
  status?: TaskStatus;
  title?: string;
  description?: string;
  priority?: number;
  dueDate?: string | null;
  assignedToId?: string | null;
  labelIds?: string[];
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskInput) => api.patch<Task>(`/api/tasks/${id}`, data),
    onMutate: async ({ id, status }) => {
      if (!status) return;
      // Cancel in-flight refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: taskKeys.list("") });
      // Snapshot all paginated list caches only (not detail queries which return a single Task)
      const snapshots = qc.getQueriesData<PaginatedResponse<Task>>({
        queryKey: taskKeys.all,
        // Only match list queries — detail queries have a different shape
        predicate: (q) => q.queryKey[1] === "list",
      });
      // Optimistic update across list caches only
      for (const [key, old] of snapshots) {
        if (!old?.data || !Array.isArray(old.data)) continue;
        qc.setQueryData<PaginatedResponse<Task>>(key, {
          ...old,
          data: old.data.map((t) => (t.id === id ? { ...t, status } : t)),
        });
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback list caches on failure
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots) {
          qc.setQueryData(key, data);
        }
      }
      // Don't show default toast here — callers pass their own onError
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task deleted");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}

// ─── Add comment ──────────────────────────────────────────────────────────────

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<import("@/types").TaskComment>(`/api/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });
}
