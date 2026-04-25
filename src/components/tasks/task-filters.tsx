"use client";

import { useRef, useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FilterChip } from "@/components/filter-chip";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import type { TaskStatus, TaskPriority } from "@/lib/validation";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending",     label: "Pending"     },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done"        },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "LOW",    label: "Low"    },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High"   },
];

const SORT_OPTIONS = [
  { value: "createdAt|desc", label: "Newest first"  },
  { value: "createdAt|asc",  label: "Oldest first"  },
  { value: "dueDate|asc",    label: "Due soon"      },
  { value: "priority|desc",  label: "Priority"      },
  { value: "title|asc",      label: "Title A–Z"     },
  { value: "updatedAt|desc", label: "Last updated"  },
];

interface TaskFiltersProps {
  totalCount: number;
  loading: boolean;
}

export function TaskFilters({ totalCount, loading }: TaskFiltersProps) {
  const { filters, setFilter, clearAll, activeFilterCount } = useTaskFilters();

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);
  function handleSearch(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter("search", value || null), 300);
  }

  // Sort combined value
  const sortValue = `${filters.sortBy}|${filters.order}`;
  function handleSort(val: string) {
    const [by, ord] = val.split("|");
    setFilter("sortBy", by);
    setFilter("order", ord);
  }

  function toggleStatus(s: TaskStatus) {
    const next = filters.status.includes(s)
      ? filters.status.filter((x) => x !== s)
      : [...filters.status, s];
    setFilter("status", next);
  }

  function togglePriority(p: TaskPriority) {
    const next = filters.priority.includes(p)
      ? filters.priority.filter((x) => x !== p)
      : [...filters.priority, p];
    setFilter("priority", next);
  }

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...filters.status.map((s) => ({
      label:    STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
      onRemove: () => setFilter("status", filters.status.filter((x) => x !== s)),
    })),
    ...filters.priority.map((p) => ({
      label:    PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p,
      onRemove: () => setFilter("priority", filters.priority.filter((x) => x !== p)),
    })),
    ...(filters.overdue ? [{ label: "Overdue", onRemove: () => setFilter("overdue", null) }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tasks…"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Status multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              Status
              {filters.status.length > 0 && (
                <Badge className="h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {filters.status.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => toggleStatus(o.value)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${filters.status.includes(o.value) ? "bg-primary border-primary" : "border-input"}`}>
                  {filters.status.includes(o.value) && <span className="text-primary-foreground text-[9px]">✓</span>}
                </span>
                {o.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Priority multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              Priority
              {filters.priority.length > 0 && (
                <Badge className="h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {filters.priority.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="start">
            {PRIORITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => togglePriority(o.value)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${filters.priority.includes(o.value) ? "bg-primary border-primary" : "border-input"}`}>
                  {filters.priority.includes(o.value) && <span className="text-primary-foreground text-[9px]">✓</span>}
                </span>
                {o.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Overdue toggle */}
        <Button
          variant={filters.overdue ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => setFilter("overdue", filters.overdue ? null : "true")}
        >
          Overdue
        </Button>

        {/* Sort */}
        <Select value={sortValue} onValueChange={handleSort}>
          <SelectTrigger className="h-9 w-38 gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active filter count + clear */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={clearAll}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters ({activeFilterCount})
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Active filter chips row */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear all
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            {loading ? "Loading…" : `${totalCount} task${totalCount !== 1 ? "s" : ""}`}
          </span>
        </div>
      )}
      {activeChips.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">
          {totalCount} task{totalCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
