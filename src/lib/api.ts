import type { ApiResponse, PaginatedResponse } from "@/types";

// ─── Error class ────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const json = (await res.json()) as { success: boolean; error?: string; code?: string; data?: T };

  if (!res.ok || !json.success) {
    throw new ApiClientError(json.error ?? "Request failed", res.status, json.code);
  }

  return json.data as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {
  get<T>(url: string): Promise<T> {
    return request<T>(url);
  },

  post<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patch<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  put<T>(url: string, body: unknown): Promise<T> {
    return request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: "DELETE",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  },
};

// ─── Paginated helper ────────────────────────────────────────────────────────

export async function fetchPaginated<T>(url: string): Promise<PaginatedResponse<T>> {
  const res = await fetch(url, { credentials: "include" });
  const json = (await res.json()) as PaginatedResponse<T> & { error?: string; code?: string };

  if (!res.ok || !json.success) {
    throw new ApiClientError(
      (json as { error?: string }).error ?? "Request failed",
      res.status,
      (json as { code?: string }).code
    );
  }

  return json;
}

// Re-export types so callers don't need to import from two places
export type { ApiResponse, PaginatedResponse };
