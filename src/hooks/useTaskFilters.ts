"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { TaskStatus, TaskPriority } from "@/lib/validation";

export type SortField = "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
export type SortOrder = "asc" | "desc";

export interface TaskFilters {
    search:       string;
    status:       TaskStatus[];
    priority:     TaskPriority[];
    assignedToId: string;
    overdue:      boolean;
    sortBy:       SortField;
    order:        SortOrder;
}

export function useTaskFilters() {
    const searchParams = useSearchParams();
    const router       = useRouter();
    const pathname     = usePathname();

    const filters: TaskFilters = {
        search:       searchParams.get("search")      ?? "",
        status:       searchParams.getAll("status")   as TaskStatus[],
        priority:     searchParams.getAll("priority") as TaskPriority[],
        assignedToId: searchParams.get("assignedToId") ?? "",
        overdue:      searchParams.get("overdue")     === "true",
        sortBy:       (searchParams.get("sortBy")     ?? "createdAt") as SortField,
        order:        (searchParams.get("order")      ?? "desc") as SortOrder,
    };

    const setFilter = useCallback(
        (key: string, value: string | string[] | boolean | undefined | null) => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("cursor");

            if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                params.delete(key);
            } else if (Array.isArray(value)) {
                params.delete(key);
                value.forEach((v) => params.append(key, v));
            } else {
                params.set(key, String(value));
            }

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname]
    );

    function toggleSort(col: SortField) {
        if (filters.sortBy === col) {
            setFilter("order", filters.order === "asc" ? "desc" : "asc");
        } else {
            setFilter("sortBy", col);
            setFilter("order", "desc");
        }
    }

    function clearAll() {
        router.push(pathname, { scroll: false });
    }

    function toQueryString(cursor?: string): string {
        const params = new URLSearchParams();
        if (filters.search)       params.set("search",       filters.search);
        filters.status.forEach((s) => params.append("status",   s));
        filters.priority.forEach((p) => params.append("priority", p));
        if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
        if (filters.overdue)      params.set("overdue",       "true");
        params.set("sortBy", filters.sortBy);
        params.set("order",  filters.order);
        if (cursor)               params.set("cursor",        cursor);
        return params.toString();
    }

    const activeFilterCount = [
        filters.search,
        filters.status.length > 0,
        filters.priority.length > 0,
        filters.assignedToId,
        filters.overdue,
    ].filter(Boolean).length;

    return { filters, setFilter, toggleSort, clearAll, toQueryString, activeFilterCount };
}
