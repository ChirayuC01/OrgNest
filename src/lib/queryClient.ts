import { QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data fresh for 30s
      gcTime: 5 * 60 * 1000, // keep unused cache for 5min
      retry: (failureCount, error) => {
        // Never retry 4xx (client errors)
        if (error instanceof ApiClientError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
