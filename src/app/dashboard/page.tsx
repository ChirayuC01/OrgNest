"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskSkeletonGrid } from "@/components/tasks/TaskSkeleton";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Plus, CheckSquare, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { useUsers } from "@/hooks/useUsers";
import { useTaskFilters } from "@/hooks/useFilters";
import { usePagination } from "@/hooks/usePagination";
import { useTaskStream } from "@/hooks/useTaskStream";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/hooks/useTasks";
import type { Task, TaskStatus } from "@/types";
import type { PaginatedResponse } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIORITY_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };

export default function TasksPage() {
  const canAccess = useAuthStore((s) => s.canAccess);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const qc = useQueryClient();

  // Pre-fetch team members for the assign dropdown in the detail dialog
  const teamParams = new URLSearchParams({ limit: "100", sortBy: "name", sortOrder: "asc" });
  const { data: teamData } = useUsers(teamParams);

  const { page, limit, setPage, reset: resetPage } = usePagination({ defaultLimit: 12 });
  const filters = useTaskFilters(resetPage);

  const params = filters.toParams(page, limit);
  const { data, isLoading } = useTasks(params);
  const updateTask = useUpdateTask();

  const tasks = data?.data ?? [];
  const meta = data?.meta ?? null;

  // SSE: merge status updates into cached query data
  useTaskStream({
    enabled: page === 1 && filters.sortBy === "createdAt" && filters.sortOrder === "desc",
    onUpdate: (streamTasks) => {
      qc.setQueriesData<PaginatedResponse<Task>>({ queryKey: taskKeys.all }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t) => {
            const remote = streamTasks.find((s) => s.id === t.id);
            return remote ? { ...t, status: remote.status as TaskStatus } : t;
          }),
        };
      });
    },
  });

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  const handleExportCSV = () => {
    const rows = tasks.map((t) => ({
      ID: t.id,
      Title: t.title,
      Status: t.status,
      Priority: PRIORITY_LABEL[t.priority] ?? t.priority,
      "Assigned To": t.assignedTo?.name ?? "",
      "Due Date": t.dueDate ?? "",
    }));
    exportToCSV(rows, `orgnest-tasks-${new Date().toISOString().slice(0, 10)}`);
    toast.success("CSV exported");
  };

  const handleExportPDF = async () => {
    const columns = ["ID", "Title", "Status", "Priority", "Assigned To", "Due Date"];
    const rows = tasks.map((t) => [
      t.id.slice(0, 8),
      t.title,
      t.status,
      PRIORITY_LABEL[t.priority] ?? String(t.priority),
      t.assignedTo?.name ?? "—",
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—",
    ]);
    await exportToPDF(
      columns,
      rows,
      "OrgNest — Task Export",
      `orgnest-tasks-${new Date().toISOString().slice(0, 10)}`
    );
    toast.success("PDF exported");
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
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 h-8 px-3 text-sm rounded-lg border border-border hover:bg-muted transition-colors outline-none">
                <Download className="h-3.5 w-3.5" />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canWrite && (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New task
            </Button>
          )}
        </div>
      </div>

      <TaskFilters
        search={filters.search}
        status={filters.status}
        priority={filters.priority}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSearchChange={filters.setSearch}
        onStatusChange={filters.setStatus}
        onPriorityChange={filters.setPriority}
        onSortByChange={filters.setSortBy}
        onSortOrderChange={filters.setSortOrder}
        onReset={filters.reset}
      />

      {isLoading ? (
        <TaskSkeletonGrid />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            filters.debouncedSearch || filters.status !== "all" || filters.priority !== "all"
              ? "No tasks match your filters. Try adjusting the search or clearing filters."
              : "Get started by creating your first task."
          }
          action={
            canWrite ? { label: "Create task", onClick: () => setCreateOpen(true) } : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onClick={(id) => setDetailTaskId(id)}
              />
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
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: taskKeys.all })}
      />

      <TaskDetailDialog
        taskId={detailTaskId}
        onOpenChange={(open) => {
          if (!open) setDetailTaskId(null);
        }}
        teamMembers={teamData?.data ?? []}
      />
    </div>
  );
}
