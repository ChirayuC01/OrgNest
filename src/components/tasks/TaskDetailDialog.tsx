"use client";

import { useState, useEffect, startTransition, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MessageSquare,
  History,
  Send,
  CheckSquare,
  Tag,
  Plus,
  UserCheck,
  Trash2,
  Pencil,
  X,
  CheckCheck,
  CalendarDays,
  User2,
  AlignLeft,
  Flame,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTask, useUpdateTask, useAddComment } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/hooks/useTasks";
import { AssigneeCombobox, LabelsCombobox } from "./TaskComboboxes";
import type { UserPublic, TaskStatus, Subtask, Label as LabelType } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  {
    value: "TODO",
    label: "To Do",
    dot: "bg-slate-400",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    dot: "bg-blue-500",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  },
  {
    value: "IN_REVIEW",
    label: "In Review",
    dot: "bg-amber-500",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  },
  {
    value: "DONE",
    label: "Done",
    dot: "bg-emerald-500",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  },
] as const;

const PRIORITY_CONFIG: Record<number, { label: string; className: string; dotClass: string }> = {
  1: { label: "Low", className: "text-slate-500", dotClass: "bg-slate-300" },
  2: { label: "Medium", className: "text-amber-600", dotClass: "bg-amber-400" },
  3: { label: "High", className: "text-red-600", dotClass: "bg-red-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Subtasks Panel ───────────────────────────────────────────────────────────

function SubtasksPanel({ taskId, canEdit }: { taskId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: subtasks = [], isLoading } = useQuery<Subtask[]>({
    queryKey: ["subtasks", taskId],
    queryFn: () => api.get<Subtask[]>(`/api/tasks/${taskId}/subtasks`),
  });

  const createSubtask = useMutation({
    mutationFn: (title: string) => api.post<Subtask>(`/api/tasks/${taskId}/subtasks`, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks", taskId] });
      setNewTitle("");
    },
    onError: () => toast.error("Failed to add subtask"),
  });

  const toggleSubtask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.patch<Subtask>(`/api/tasks/${taskId}/subtasks/${id}`, { completed }),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["subtasks", taskId] });
      const snap = qc.getQueryData<Subtask[]>(["subtasks", taskId]);
      qc.setQueryData<Subtask[]>(["subtasks", taskId], (prev) =>
        prev?.map((s) => (s.id === id ? { ...s, completed } : s))
      );
      return { snap };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snap) qc.setQueryData(["subtasks", taskId], ctx.snap);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["subtasks", taskId] }),
  });

  const deleteSubtask = useMutation({
    mutationFn: (id: string) =>
      api.delete<{ message: string }>(`/api/tasks/${taskId}/subtasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtasks", taskId] }),
    onError: () => toast.error("Failed to delete subtask"),
  });

  const completed = subtasks.filter((s) => s.completed).length;
  const pct = subtasks.length > 0 ? Math.round((completed / subtasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {subtasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {completed} of {subtasks.length} complete
            </span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                pct === 100 ? "text-emerald-600" : "text-foreground"
              )}
            >
              {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct === 100 ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {subtasks.map((s) => (
          <li
            key={s.id}
            className={cn(
              "flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl group transition-colors border",
              s.completed
                ? "bg-muted/30 border-transparent"
                : "bg-background border-border/50 hover:border-border hover:bg-muted/20"
            )}
          >
            <Checkbox
              id={`subtask-${s.id}`}
              checked={s.completed}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                toggleSubtask.mutate({ id: s.id, completed: checked === true })
              }
              className="shrink-0"
            />
            <label
              htmlFor={`subtask-${s.id}`}
              className={cn(
                "flex-1 text-sm cursor-pointer select-none leading-snug",
                s.completed && "line-through text-muted-foreground"
              )}
            >
              {s.title}
            </label>
            {canEdit && (
              /* Always visible on touch devices; hover-only on pointer devices */
              <button
                onClick={() => deleteSubtask.mutate(s.id)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="flex gap-2 pt-1">
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a subtask…"
            className="h-10 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                createSubtask.mutate(newTitle.trim());
              }
            }}
          />
          <Button
            variant="outline"
            className="h-10 px-4 shrink-0"
            disabled={!newTitle.trim() || createSubtask.isPending}
            onClick={() => createSubtask.mutate(newTitle.trim())}
          >
            {createSubtask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Labels display ───────────────────────────────────────────────────────────

function LabelsDisplay({ labels }: { labels: { label: LabelType }[] }) {
  if (labels.length === 0) return <span className="text-sm text-muted-foreground">No labels</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map(({ label }) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
// Stacks vertically on mobile, horizontal two-column on sm+.

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-6 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border/40 last:border-0">
      <div className="sm:w-28 flex items-center gap-2 shrink-0 text-muted-foreground">
        <span className="shrink-0">{icon}</span>
        <span className="text-xs sm:text-sm font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface TaskDetailDialogProps {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  teamMembers?: UserPublic[];
}

export function TaskDetailDialog({
  taskId,
  onOpenChange,
  teamMembers = [],
}: TaskDetailDialogProps) {
  const open = !!taskId;
  const user = useAuthStore((s) => s.user);
  const canWrite = useAuthStore((s) => s.canAccess)("TASKS", "WRITE");
  const isEmployee = user?.role === "EMPLOYEE";

  const { data: task, isLoading } = useTask(taskId);
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState("2");
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [editDue, setEditDue] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editLabelIds, setEditLabelIds] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const { data: availableLabels = [] } = useQuery<LabelType[]>({
    queryKey: ["labels"],
    queryFn: () => api.get<LabelType[]>("/api/labels"),
    staleTime: 60_000,
  });

  const updateTask = useUpdateTask();
  const addComment = useAddComment(taskId ?? "");

  useEffect(() => {
    if (!task) return;
    startTransition(() => {
      setEditTitle(task.title);
      setEditDesc(task.description ?? "");
      setEditPriority(String(task.priority));
      setEditAssignee(task.assignedToId ?? null);
      setEditDue(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
      setEditStatus(task.status);
      setEditLabelIds(task.labels.map((tl) => tl.label.id));
      setEditing(false);
    });
  }, [task]);

  const handleStatusChange = (newStatus: string) => {
    if (!taskId) return;
    updateTask.mutate(
      { id: taskId, status: newStatus as TaskStatus },
      {
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Cannot make that status change");
        },
      }
    );
  };

  const handleSave = () => {
    if (!taskId) return;
    updateTask.mutate(
      {
        id: taskId,
        title: editTitle,
        description: editDesc || undefined,
        priority: Number(editPriority),
        assignedToId: editAssignee,
        dueDate: editDue || null,
        status: editStatus as TaskStatus,
        labelIds: editLabelIds,
      },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Task updated");
          qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update task");
        },
      }
    );
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment.mutate(comment.trim(), {
      onSuccess: () => setComment(""),
    });
  };

  const handleAssignToMe = () => {
    if (!taskId || !user) return;
    updateTask.mutate(
      { id: taskId, assignedToId: user.userId },
      {
        onSuccess: () => toast.success("Task assigned to you"),
        onError: () => toast.error("Failed to assign task"),
      }
    );
  };

  const statusOpt =
    STATUS_OPTIONS.find((s) => s.value === (task?.status ?? "TODO")) ?? STATUS_OPTIONS[0];

  const groupedHistory = task?.history?.reduce<Record<string, typeof task.history>>((acc, h) => {
    const group = formatDateGroup(h.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(h);
    return acc;
  }, {});

  const priorityConfig = PRIORITY_CONFIG[task?.priority ?? 2];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Sizing: full-screen on mobile, constrained sheet on sm+
          "w-full max-w-none sm:max-w-lg md:max-w-2xl lg:max-w-4xl",
          "h-[100dvh] sm:h-auto sm:max-h-[90vh]",
          // Layout
          "flex flex-col overflow-hidden",
          // Remove default padding/gap — we control spacing per-section
          "p-0 gap-0",
          // Rounded corners only on larger screens
          "rounded-none sm:rounded-xl"
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-border">
          {isLoading || !task ? (
            <div className="space-y-3 pr-8">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : (
            <>
              {/* Title row + status badge + edit button */}
              <div className="flex items-start gap-3 pr-8">
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-base sm:text-xl font-semibold h-auto py-1 px-2 -ml-2"
                      autoFocus
                    />
                  ) : (
                    <DialogTitle className="text-base sm:text-xl font-semibold leading-snug">
                      {task.title}
                    </DialogTitle>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status badge — hidden on the smallest screens to save space */}
                  <span
                    className={cn(
                      "hidden xs:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium",
                      statusOpt.className
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusOpt.dot)} />
                    <span className="hidden sm:inline">{statusOpt.label}</span>
                  </span>

                  {canWrite && !isEmployee && (
                    <button
                      onClick={() => setEditing((e) => !e)}
                      title={editing ? "Cancel editing" : "Edit task"}
                      className={cn(
                        "p-1.5 sm:p-2 rounded-lg transition-colors",
                        editing
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {editing ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                Created by{" "}
                <span className="font-medium text-foreground/80">{task.createdBy?.name}</span>
                {" · "}
                {formatDate(task.createdAt)}
              </p>
            </>
          )}
        </div>

        {/* ── Loading skeleton ────────────────────────────────────────────────── */}
        {isLoading || !task ? (
          <div className="space-y-4 p-4 sm:p-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col min-h-0">

            {/* ── Tab bar ──────────────────────────────────────────────────────
                grid-cols-4 keeps all 4 tabs in a single row at every breakpoint.
                On mobile only icons are shown; text appears from sm up.
            ─────────────────────────────────────────────────────────────────── */}
            <div className="shrink-0 px-3 sm:px-8 py-2.5 sm:py-3 border-b border-border">
              <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
                <TabsTrigger value="details" className="gap-1.5 text-xs sm:text-sm px-1 sm:px-3">
                  <AlignLeft className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>

                <TabsTrigger value="subtasks" className="gap-1.5 text-xs sm:text-sm px-1 sm:px-3">
                  <CheckSquare className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Subtasks</span>
                  {task.subtasks.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="hidden sm:flex h-5 min-w-[20px] px-1.5 text-[10px] font-semibold"
                    >
                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm px-1 sm:px-3">
                  <History className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">History</span>
                  {(task.history?.length ?? 0) > 0 && (
                    <Badge
                      variant="secondary"
                      className="hidden sm:flex h-5 min-w-[20px] px-1.5 text-[10px] font-semibold"
                    >
                      {task.history?.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger value="comments" className="gap-1.5 text-xs sm:text-sm px-1 sm:px-3">
                  <MessageSquare className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Comments</span>
                  {(task.comments?.length ?? 0) > 0 && (
                    <Badge
                      variant="secondary"
                      className="hidden sm:flex h-5 min-w-[20px] px-1.5 text-[10px] font-semibold"
                    >
                      {task.comments?.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Details tab ──────────────────────────────────────────────── */}
            <TabsContent
              value="details"
              className="mt-0 flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-0"
            >
              <div className="rounded-xl border border-border overflow-hidden mb-5 sm:mb-6">
                {/* Status */}
                <FieldRow icon={<Activity className="h-4 w-4" />} label="Status">
                  <Select
                    value={editing ? editStatus : task.status}
                    onValueChange={(v) => {
                      if (v) {
                        if (editing) setEditStatus(v);
                        else handleStatusChange(v);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-full sm:w-48 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
                            {s.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldRow>

                {/* Priority */}
                <FieldRow icon={<Flame className="h-4 w-4" />} label="Priority">
                  {editing ? (
                    <Select value={editPriority} onValueChange={(v) => v && setEditPriority(v)}>
                      <SelectTrigger className="h-9 w-full sm:w-40 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 text-sm font-medium",
                        priorityConfig?.className
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", priorityConfig?.dotClass)} />
                      {priorityConfig?.label}
                    </span>
                  )}
                </FieldRow>

                {/* Due date */}
                <FieldRow icon={<CalendarDays className="h-4 w-4" />} label="Due date">
                  {editing ? (
                    <Input
                      type="date"
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                      className="h-9 w-full sm:w-48 text-sm"
                    />
                  ) : (
                    <span className="text-sm">
                      {task.dueDate ? (
                        new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  )}
                </FieldRow>

                {/* Assignee */}
                <FieldRow icon={<User2 className="h-4 w-4" />} label="Assignee">
                  {editing && !isEmployee ? (
                    <AssigneeCombobox
                      members={teamMembers}
                      value={editAssignee}
                      onChange={setEditAssignee}
                    />
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {task.assignedTo ? (
                        <>
                          <Avatar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0">
                            <AvatarFallback className="text-[10px] bg-primary/15 text-primary font-semibold">
                              {initials(task.assignedTo.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">
                              {task.assignedTo.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {task.assignedTo.email}
                            </p>
                          </div>
                          {canWrite && !isEmployee && task.assignedToId !== user?.userId && (
                            <button
                              onClick={handleAssignToMe}
                              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Assign to me</span>
                              <span className="sm:hidden">Me</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                          {canWrite && !isEmployee && (
                            <button
                              onClick={handleAssignToMe}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Assign to me</span>
                              <span className="sm:hidden">Me</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </FieldRow>

                {/* Labels */}
                <FieldRow icon={<Tag className="h-4 w-4" />} label="Labels">
                  {editing ? (
                    <LabelsCombobox
                      labels={availableLabels}
                      value={editLabelIds}
                      onChange={setEditLabelIds}
                    />
                  ) : (
                    <LabelsDisplay labels={task.labels} />
                  )}
                </FieldRow>

                {/* Description */}
                <FieldRow icon={<AlignLeft className="h-4 w-4" />} label="Description">
                  {editing ? (
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={4}
                      placeholder="Add a description…"
                      className="text-sm resize-none"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap min-h-[1.5rem]">
                      {task.description || (
                        <span className="italic text-muted-foreground/50">No description</span>
                      )}
                    </p>
                  )}
                </FieldRow>
              </div>

              {/* Save / discard */}
              {canWrite && !isEmployee && editing && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateTask.isPending}
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    {updateTask.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                    Save changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setEditing(false)}
                    className="flex-1 sm:flex-none"
                  >
                    Discard
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground/50 mt-5 sm:mt-6">
                Last updated {formatDate(task.updatedAt)}
              </p>
            </TabsContent>

            {/* ── Subtasks tab ──────────────────────────────────────────────── */}
            <TabsContent
              value="subtasks"
              className="mt-0 flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6"
            >
              <SubtasksPanel taskId={task.id} canEdit={canWrite || isEmployee} />
            </TabsContent>

            {/* ── History tab ───────────────────────────────────────────────── */}
            <TabsContent
              value="history"
              className="mt-0 flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6"
            >
              {(task.history?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <History className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold">No history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Changes to this task will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedHistory ?? {}).map(([group, entries]) => (
                    <div key={group}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                          {group}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <ol className="space-y-3">
                        {entries.map((h) => (
                          <li key={h.id} className="flex gap-2 sm:gap-3">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 mt-0.5">
                              <AvatarFallback className="text-[10px] bg-muted font-semibold">
                                {initials(h.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 rounded-xl bg-muted/40 border border-border/40 px-3 sm:px-4 py-3 sm:py-3.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2">
                                <span className="text-sm font-semibold">{h.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(h.createdAt)}
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {(h.changes as import("@/types").TaskHistoryChange[]).map(
                                  (c, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">
                                      <span className="font-medium text-foreground">{c.field}</span>
                                      {c.oldValue && (
                                        <>
                                          {" "}
                                          from{" "}
                                          <span className="line-through text-muted-foreground/60">
                                            {c.oldValue}
                                          </span>
                                        </>
                                      )}
                                      {c.newValue && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="font-medium text-foreground">
                                            {c.newValue}
                                          </span>
                                        </>
                                      )}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Comments tab ──────────────────────────────────────────────── */}
            <TabsContent
              value="comments"
              className="mt-0 flex-1 overflow-hidden flex flex-col min-h-0"
            >
              {/* Scrollable message list */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
                {(task.comments?.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">No comments yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Be the first to leave a comment
                    </p>
                  </div>
                ) : (
                  task.comments?.map((c) => {
                    const isOwn = c.user.id === user?.userId;
                    return (
                      <div key={c.id} className={cn("flex gap-2 sm:gap-3", isOwn && "flex-row-reverse")}>
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 mt-0.5">
                          <AvatarFallback
                            className={cn(
                              "text-[10px] font-semibold",
                              isOwn
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {initials(c.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "flex flex-col gap-1 sm:gap-1.5 max-w-[80%] sm:max-w-[70%]",
                            isOwn && "items-end"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-baseline gap-1.5 sm:gap-2",
                              isOwn && "flex-row-reverse"
                            )}
                          >
                            <span className="text-xs sm:text-sm font-semibold">
                              {isOwn ? "You" : c.user.name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatDate(c.createdAt)}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "text-sm break-words rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 leading-relaxed",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted text-foreground rounded-tl-sm"
                            )}
                          >
                            {c.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment composer — pinned to bottom */}
              <div className="shrink-0 px-3 sm:px-8 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-border">
                <div className="flex gap-2 sm:gap-3 items-end">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment…"
                    rows={2}
                    className="resize-none text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment();
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-xl shrink-0"
                    onClick={handleComment}
                    disabled={!comment.trim() || addComment.isPending}
                  >
                    {addComment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 hidden sm:block">
                  Press{" "}
                  <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                    Ctrl+Enter
                  </kbd>{" "}
                  to send
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
