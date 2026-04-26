"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  status: string;
  priority: string;
  sortBy: string;
  sortOrder: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onSortByChange: (v: string) => void;
  onSortOrderChange: (v: string) => void;
  onReset: () => void;
}

export function TaskFilters({
  search,
  status,
  priority,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
}: TaskFiltersProps) {
  const hasFilters = search || (status && status !== "all") || (priority && priority !== "all");

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9 w-48 text-sm"
        />
      </div>

      <Select value={status || "all"} onValueChange={(v) => v && onStatusChange(v)}>
        <SelectTrigger className="h-9 w-36 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="IN_REVIEW">In Review</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priority || "all"} onValueChange={(v) => v && onPriorityChange(v)}>
        <SelectTrigger className="h-9 w-32 text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="1">Low</SelectItem>
          <SelectItem value="2">Medium</SelectItem>
          <SelectItem value="3">High</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(v) => v && onSortByChange(v)}>
        <SelectTrigger className="h-9 w-36 text-sm">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Created</SelectItem>
          <SelectItem value="updatedAt">Updated</SelectItem>
          <SelectItem value="dueDate">Due date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortOrder} onValueChange={(v) => v && onSortOrderChange(v)}>
        <SelectTrigger className="h-9 w-28 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest</SelectItem>
          <SelectItem value="asc">Oldest</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-9 gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
