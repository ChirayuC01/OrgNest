"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsData } from "@/types";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get<AnalyticsData>("/api/analytics"),
    staleTime: 60_000, // analytics can be slightly stale
  });
}
