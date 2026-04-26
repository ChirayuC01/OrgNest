import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";

export interface TaskFiltersState {
  search: string;
  status: string;
  priority: string;
  sortBy: string;
  sortOrder: string;
}

export interface AuditFiltersState {
  search: string;
  action: string;
  entity: string;
  dateFrom: string;
  dateTo: string;
}

export function useTaskFilters(onFilterChange?: () => void) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    onFilterChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, priority, sortBy, sortOrder]);

  const reset = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const toParams = (page: number, limit: number): URLSearchParams => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
    if (debouncedSearch) p.set("search", debouncedSearch);
    if (status !== "all") p.set("status", status);
    if (priority !== "all") p.set("priority", priority);
    return p;
  };

  return {
    search,
    setSearch,
    status,
    setStatus,
    priority,
    setPriority,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    debouncedSearch,
    reset,
    toParams,
  };
}

export function useAuditFilters(onFilterChange?: () => void) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    onFilterChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, entity, dateFrom, dateTo]);

  const reset = () => {
    setSearch("");
    setAction("all");
    setEntity("all");
    setDateFrom("");
    setDateTo("");
  };

  const toParams = (page: number, limit: number): URLSearchParams => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit), sortOrder: "desc" });
    if (action !== "all") p.set("action", action);
    if (entity !== "all") p.set("entity", entity);
    if (dateFrom) p.set("dateFrom", new Date(dateFrom).toISOString());
    if (dateTo) p.set("dateTo", new Date(dateTo + "T23:59:59").toISOString());
    return p;
  };

  return {
    search,
    setSearch,
    action,
    setAction,
    entity,
    setEntity,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    reset,
    toParams,
  };
}
