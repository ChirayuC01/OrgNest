"use client";

import { useAuthStore } from "@/store/authStore";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, AlertCircle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

function WidgetCard({
  title,
  icon: Icon,
  totalCount,
  isLoading,
  color,
  tasks,
  onTaskClick,
}: {
  title: string;
  icon: React.ElementType;
  totalCount: number;
  isLoading: boolean;
  color: string;
  tasks: { id: string; title: string; status: string }[];
  onTaskClick: (id: string) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          {title}
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">All clear!</p>
        ) : (
          <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {tasks.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onTaskClick(t.id)}
                  className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted transition-colors line-clamp-1"
                  title={t.title}
                >
                  {t.title}
                </button>
              </li>
            ))}
            {totalCount > tasks.length && (
              <li className="text-xs text-muted-foreground px-2 pt-0.5">
                +{totalCount - tasks.length} more
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardWidgetsProps {
  onTaskClick: (id: string) => void;
}

export function DashboardWidgets({ onTaskClick }: DashboardWidgetsProps) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.userId ?? "";

  const today = new Date();
  // Use start-of-day in local time, converted to ISO for the query
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  // ── My Tasks (assigned to me, not DONE) ──────────────────────────────────
  // We fetch without status filter, then exclude DONE client-side so we get an
  // accurate count from meta.total minus DONE. Instead: add a notStatus param.
  // Simpler: fetch with large limit and filter locally.
  const myTasksParams = new URLSearchParams(
    userId
      ? { assignedToId: userId, limit: "50", sortBy: "dueDate", sortOrder: "asc" }
      : { limit: "1" } // placeholder while auth loads
  );
  const { data: myTasksData, isLoading: myTasksLoading } = useTasks(myTasksParams);

  // ── Overdue (due before today, not DONE) ─────────────────────────────────
  const overdueParams = new URLSearchParams({
    dueBefore: todayStart.toISOString(),
    limit: "50",
    sortBy: "dueDate",
    sortOrder: "asc",
  });
  const { data: overdueData, isLoading: overdueLoading } = useTasks(overdueParams);

  // ── Due Today ─────────────────────────────────────────────────────────────
  const dueTodayParams = new URLSearchParams({
    dueAfter: todayStart.toISOString(),
    dueBefore: todayEnd.toISOString(),
    limit: "50",
    sortBy: "priority",
    sortOrder: "desc",
  });
  const { data: dueTodayData, isLoading: dueTodayLoading } = useTasks(dueTodayParams);

  // Filter out DONE tasks client-side (we can't filter by "not status" in the API)
  const myTasks = (myTasksData?.data ?? []).filter(
    (t) => t.status !== "DONE" && (userId ? t.assignedToId === userId : false)
  );
  const overdueTasks = (overdueData?.data ?? []).filter((t) => t.status !== "DONE");
  const dueTodayTasks = (dueTodayData?.data ?? []).filter((t) => t.status !== "DONE");

  // Use filtered lengths as the count (most accurate we can get without a dedicated API)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <WidgetCard
        title="My Tasks"
        icon={CheckSquare}
        totalCount={myTasks.length}
        isLoading={myTasksLoading || !userId}
        color="text-blue-500"
        tasks={myTasks}
        onTaskClick={onTaskClick}
      />
      <WidgetCard
        title="Overdue"
        icon={AlertCircle}
        totalCount={overdueTasks.length}
        isLoading={overdueLoading}
        color="text-red-500"
        tasks={overdueTasks}
        onTaskClick={onTaskClick}
      />
      <WidgetCard
        title="Due Today"
        icon={CalendarClock}
        totalCount={dueTodayTasks.length}
        isLoading={dueTodayLoading}
        color="text-amber-500"
        tasks={dueTodayTasks}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
