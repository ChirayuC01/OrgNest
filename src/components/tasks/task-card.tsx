"use client";

import { Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/store/taskStore";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate) < new Date();
}

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <Card
      className="cursor-pointer hover:shadow-sm transition-all border hover:border-primary/30 group"
      onClick={() => onClick(task)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Title + badges row */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge   status={task.status}   />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
        )}

        {/* Footer: assignee + due date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {task.assignedUser ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600">
                    {task.assignedUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{task.assignedUser.name}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground/50">Unassigned</span>
            )}
          </div>

          {task.dueDate && (
            <div className={cn("flex items-center gap-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
              {overdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
