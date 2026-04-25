"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingCardList } from "@/components/loading-card";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { useTaskStore } from "@/store/taskStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import type { Task } from "@/store/taskStore";

function DashboardContent() {
  const { tasks, loading, error, nextCursor, totalCount, fetchTasks, fetchMore, resetTasks } =
    useTaskStore();
  const { can }                 = usePermissions();
  const { toQueryString }       = useTaskFilters();
  const searchParams            = useSearchParams();
  const [selected, setSelected] = useState<Task | null>(null);

  // Re-fetch whenever URL filter params change
  useEffect(() => {
    const qs = toQueryString();
    fetchTasks(qs);
    return () => resetTasks();
  }, [searchParams.toString()]);

  function handleLoadMore() {
    fetchMore(toQueryString());
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Manage and track work across your team">
        {can("TASKS", "write") && <CreateTaskDialog />}
      </PageHeader>

      <TaskFilters totalCount={totalCount} loading={loading} />

      {/* Task list */}
      {loading && tasks.length === 0 ? (
        <LoadingCardList count={5} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchTasks(toQueryString())}>
            Try again
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks found"
          description={
            totalCount === 0
              ? "Create your first task to get started."
              : "Try adjusting your filters to see more results."
          }
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={setSelected} />
          ))}

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}

      <TaskDetailSheet task={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
