"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPaginated } from "@/lib/api";
import type { AuditLog } from "@/types";

export const auditKeys = {
  all: ["audit"] as const,
  list: (params: string) => ["audit", "list", params] as const,
};

export function useAuditLogs(params: URLSearchParams) {
  const key = params.toString();
  return useQuery({
    queryKey: auditKeys.list(key),
    queryFn: () => fetchPaginated<AuditLog>(`/api/audit?${key}`),
  });
}
