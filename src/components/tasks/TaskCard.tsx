import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: number;
  dueDate?: string | null;
  assignedTo?: { name: string; email: string } | null;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: "To Do", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  IN_REVIEW: { label: "In Review", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  DONE: { label: "Done", className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
};

const priorityConfig: Record<number, { dot: string; label: string }> = {
  1: { dot: "bg-green-500", label: "Low" },
  2: { dot: "bg-amber-500", label: "Medium" },
  3: { dot: "bg-red-500", label: "High" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export function TaskCard({ task }: { task: Task }) {
  const status = statusConfig[task.status] ?? statusConfig.TODO;
  const priority = priorityConfig[task.priority] ?? priorityConfig[2];
  const assigneeInitials = task.assignedTo?.name
    ? task.assignedTo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  const overdue = task.dueDate && task.status !== "DONE" && isOverdue(task.dueDate);

  return (
    <Card className="group hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              status.className
            )}
          >
            {status.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={cn("w-2 h-2 rounded-full", priority.dot)} />
            {priority.label}
          </span>
        </div>
        <h3 className="font-medium text-sm leading-snug mt-1.5 line-clamp-2 group-hover:text-primary transition-colors">
          {task.title}
        </h3>
      </CardHeader>
      <CardContent>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {assigneeInitials ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                  {assigneeInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {task.assignedTo?.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}

          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue ? "text-destructive font-medium" : "text-muted-foreground"
              )}
            >
              {overdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
