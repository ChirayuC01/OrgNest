"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskSkeletonGrid } from "@/components/tasks/TaskSkeleton";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Plus, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: number;
  dueDate?: string | null;
  assignedTo?: { name: string; email: string } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TasksPage() {
  const canAccess = useAuthStore((state) => state.canAccess);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status && status !== "all") params.set("status", status);
      if (priority && priority !== "all") params.set("priority", priority);

      const res = await fetch(`/api/tasks?${params}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setTasks(json.data);
        setMeta(json.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, debouncedSearch, status, priority]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, sortBy, sortOrder]);

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const canWrite = canAccess("TASKS", "WRITE");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          {meta && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta.total} {meta.total === 1 ? "task" : "tasks"}
            </p>
          )}
        </div>
        {canWrite && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New task
          </Button>
        )}
      </div>

      <TaskFilters
        search={search}
        status={status}
        priority={priority}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onReset={handleReset}
      />

      {loading ? (
        <TaskSkeletonGrid />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            search || (status && status !== "all") || (priority && priority !== "all")
              ? "No tasks match your filters. Try adjusting the search or clearing filters."
              : "Get started by creating your first task."
          }
          action={canWrite ? { label: "Create task", onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchTasks}
      />
    </div>
  );
}
