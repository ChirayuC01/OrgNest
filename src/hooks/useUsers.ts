"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, fetchPaginated } from "@/lib/api";
import type { UserPublic } from "@/types";
import { toast } from "sonner";

export const userKeys = {
  all: ["users"] as const,
  list: (params: string) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers(params: URLSearchParams) {
  const key = params.toString();
  return useQuery({
    queryKey: userKeys.list(key),
    queryFn: () => fetchPaginated<UserPublic>(`/api/users?${key}`),
  });
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) => api.post<UserPublic>("/api/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User added to team");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    },
  });
}

interface UpdateUserInput {
  id: string;
  name?: string;
  role?: string;
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUserInput) =>
      api.patch<UserPublic>(`/api/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });
}

// ─── Profile update ───────────────────────────────────────────────────────────

interface UpdateProfileInput {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api.patch<Pick<UserPublic, "id" | "name" | "email" | "role">>("/api/users/me", data),
    onSuccess: () => {
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    },
  });
}
