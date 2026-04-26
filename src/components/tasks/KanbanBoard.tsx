"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "TODO", label: "To Do", color: "bg-slate-100 dark:bg-slate-800" },
  { status: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50 dark:bg-blue-950/30" },
  { status: "IN_REVIEW", label: "In Review", color: "bg-amber-50 dark:bg-amber-950/30" },
  { status: "DONE", label: "Done", color: "bg-green-50 dark:bg-green-950/30" },
];

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-slate-400",
  2: "bg-amber-400",
  3: "bg-red-500",
};

const PRIORITY_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface KanbanCardProps {
  task: Task;
  onClick: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  isDraggedOver: boolean;
}

function KanbanCard({ task, onClick, isDraggedOver }: KanbanCardProps) {
  const isOverdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
      onClick={() => onClick(task.id)}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-all select-none",
        isDraggedOver && "opacity-50 scale-95",
        "active:cursor-grabbing"
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="h-1.5 rounded-full w-8"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{task.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])}
            title={PRIORITY_LABEL[task.priority]}
          />
          {task.dueDate && (
            <span
              className={cn(
                "text-[10px]",
                isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
              )}
            >
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          )}
        </div>

        {task.assignedTo ? (
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
              {initials(task.assignedTo.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[10px] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onClick: (taskId: string) => void;
}

export function KanbanBoard({ tasks, onStatusChange, onClick }: KanbanBoardProps) {
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onStatusChange(taskId, targetStatus);
      }
    }
    setDraggedOver(null);
    setActiveTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    setDraggedOver(status);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-h-[500px]">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            className={cn(
              "rounded-xl p-3 flex flex-col gap-2 transition-colors border-2",
              col.color,
              draggedOver === col.status ? "border-primary/50" : "border-transparent"
            )}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={() => setDraggedOver(null)}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge variant="secondary" className="text-xs px-1.5 h-5">
                {colTasks.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {colTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onClick={onClick}
                  onStatusChange={onStatusChange}
                  isDraggedOver={activeTaskId === task.id}
                />
              ))}
              {colTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center py-4">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
