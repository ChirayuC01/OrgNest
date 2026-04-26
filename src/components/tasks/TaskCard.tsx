"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onClick?: (taskId: string) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; className: string }[] = [
  {
    value: "TODO",
    label: "To Do",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    value: "IN_REVIEW",
    label: "In Review",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  {
    value: "DONE",
    label: "Done",
    className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  },
];

const statusMap = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

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

export function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const status = statusMap[task.status] ?? STATUS_OPTIONS[0];
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
    <Card
      className={cn(
        "group hover:shadow-md hover:border-primary/20 transition-all duration-200",
        onClick && "cursor-pointer"
      )}
      onClick={onClick ? () => onClick(task.id) : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Status badge — clickable if onStatusChange provided */}
          {onStatusChange ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80",
                  status.className
                )}
              >
                {status.label}
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onStatusChange(task.id, opt.value)}
                    className={cn(task.status === opt.value && "font-semibold")}
                  >
                    <span
                      className={cn("w-2 h-2 rounded-full mr-2 inline-block", {
                        "bg-slate-400": opt.value === "TODO",
                        "bg-blue-500": opt.value === "IN_PROGRESS",
                        "bg-amber-500": opt.value === "IN_REVIEW",
                        "bg-green-500": opt.value === "DONE",
                      })}
                    />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                status.className
              )}
            >
              {status.label}
            </span>
          )}

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
              {overdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
