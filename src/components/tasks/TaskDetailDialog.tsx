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
  Clock,
  MessageSquare,
  History,
  Send,
  CheckSquare,
  Tag,
  Plus,
  UserCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTask, useUpdateTask, useAddComment } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/hooks/useTasks";
import type { UserPublic, TaskStatus, Subtask, Label as LabelType } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
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
] as const;

const PRIORITY_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };

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
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right">
            {completed}/{subtasks.length}
          </span>
        </div>
      )}

      <ul className="space-y-1.5">
        {subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2 group">
            <Checkbox
              id={`subtask-${s.id}`}
              checked={s.completed}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                toggleSubtask.mutate({ id: s.id, completed: checked === true })
              }
            />
            <label
              htmlFor={`subtask-${s.id}`}
              className={cn(
                "flex-1 text-sm cursor-pointer select-none",
                s.completed && "line-through text-muted-foreground"
              )}
            >
              {s.title}
            </label>
            {canEdit && (
              <button
                onClick={() => deleteSubtask.mutate(s.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a subtask…"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                createSubtask.mutate(newTitle.trim());
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!newTitle.trim() || createSubtask.isPending}
            onClick={() => createSubtask.mutate(newTitle.trim())}
          >
            <Plus className="h-3.5 w-3.5" />
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
    <div className="flex flex-wrap gap-1.5">
      {labels.map(({ label }) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </span>
      ))}
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

  // Edit state (manager/admin)
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState("2");
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [editDue, setEditDue] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");

  // Comment state
  const [comment, setComment] = useState("");

  const updateTask = useUpdateTask();
  const addComment = useAddComment(taskId ?? "");

  // Sync edit form when task loads
  useEffect(() => {
    if (!task) return;
    startTransition(() => {
      setEditTitle(task.title);
      setEditDesc(task.description ?? "");
      setEditPriority(String(task.priority));
      setEditAssignee(task.assignedToId ?? null);
      setEditDue(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
      setEditStatus(task.status);
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

  const filteredTeam = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const statusOpt =
    STATUS_OPTIONS.find((s) => s.value === (task?.status ?? "TODO")) ?? STATUS_OPTIONS[0];

  // Group history by date
  const groupedHistory = task?.history?.reduce<Record<string, typeof task.history>>((acc, h) => {
    const group = formatDateGroup(h.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(h);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          {isLoading || !task ? (
            <Skeleton className="h-6 w-3/4" />
          ) : (
            <div className="flex items-start justify-between gap-3 pr-6">
              <DialogTitle className="text-base leading-snug flex-1">
                {editing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-base font-semibold"
                    autoFocus
                  />
                ) : (
                  task.title
                )}
              </DialogTitle>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                  statusOpt.className
                )}
              >
                {statusOpt.label}
              </span>
            </div>
          )}
        </DialogHeader>

        {isLoading || !task ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <TabsList className="shrink-0 w-full justify-start">
              <TabsTrigger value="details" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="subtasks" className="gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Subtasks
                {task.subtasks.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                    {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                History
                {(task.history?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                    {task.history?.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments
                {(task.comments?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                    {task.comments?.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Details tab ── */}
            <TabsContent
              value="details"
              className="mt-0 flex-1 overflow-y-auto space-y-4 pt-4 pr-1"
            >
              {/* Status change — all roles */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editing ? editStatus : task.status}
                  onValueChange={(v) => {
                    if (v) {
                      if (editing) setEditStatus(v);
                      else handleStatusChange(v);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description</Label>
                {editing ? (
                  <Textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    placeholder="Add a description…"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[2rem]">
                    {task.description || <span className="italic">No description</span>}
                  </p>
                )}
              </div>

              {/* Labels */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Labels
                </Label>
                <LabelsDisplay labels={task.labels} />
              </div>

              {/* Priority + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  {editing ? (
                    <Select value={editPriority} onValueChange={(v) => v && setEditPriority(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">{PRIORITY_LABEL[task.priority]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}
                    </p>
                  )}
                </div>
              </div>

              {/* Assignee — editable only for manager/admin */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Assigned to</Label>
                  {canWrite && !isEmployee && task.assignedToId !== user?.userId && (
                    <button
                      onClick={handleAssignToMe}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <UserCheck className="h-3 w-3" />
                      Assign to me
                    </button>
                  )}
                </div>
                {editing && !isEmployee ? (
                  <div className="space-y-1.5">
                    <Input
                      placeholder="Search members…"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Select
                      value={editAssignee ?? "unassigned"}
                      onValueChange={(v) => setEditAssignee(v === "unassigned" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {filteredTeam.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">
                                  {initials(m.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{m.name}</span>
                              <span className="text-muted-foreground text-xs">{m.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {task.assignedTo ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {initials(task.assignedTo.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignedTo.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.assignedTo.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  Created by {task.createdBy?.name} · {formatDate(task.createdAt)}
                </p>
                <p>Last updated {formatDate(task.updatedAt)}</p>
              </div>

              {/* Action buttons */}
              {canWrite && !isEmployee && (
                <div className="flex gap-2 pt-1">
                  {editing ? (
                    <>
                      <Button size="sm" onClick={handleSave} disabled={updateTask.isPending}>
                        {updateTask.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : null}
                        Save changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      Edit task
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Subtasks tab ── */}
            <TabsContent value="subtasks" className="mt-0 flex-1 overflow-y-auto pt-4 pr-1">
              <SubtasksPanel taskId={task.id} canEdit={canWrite || isEmployee} />
            </TabsContent>

            {/* ── History tab ── */}
            <TabsContent value="history" className="mt-0 flex-1 overflow-y-auto pt-4 pr-1">
              {(task.history?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No changes recorded yet
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedHistory ?? {}).map(([group, entries]) => (
                    <div key={group}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        {group}
                      </p>
                      <ol className="relative border-l border-border ml-3 space-y-4">
                        {entries.map((h) => (
                          <li key={h.id} className="ml-4">
                            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary/30 border border-primary/50" />
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px] bg-muted">
                                  {initials(h.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{h.user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(h.createdAt)}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {(h.changes as import("@/types").TaskHistoryChange[]).map((c, i) => (
                                <li key={i} className="text-xs text-muted-foreground">
                                  Changed{" "}
                                  <span className="font-medium text-foreground">{c.field}</span>
                                  {c.oldValue && (
                                    <>
                                      {" "}
                                      from <span className="line-through">{c.oldValue}</span>
                                    </>
                                  )}
                                  {c.newValue && (
                                    <>
                                      {" "}
                                      to{" "}
                                      <span className="font-medium text-foreground">
                                        {c.newValue}
                                      </span>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Comments tab ── */}
            <TabsContent
              value="comments"
              className="mt-0 flex-1 overflow-y-auto flex flex-col pt-4 pr-1 min-h-0"
            >
              <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                {(task.comments?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Be the first!
                  </p>
                ) : (
                  task.comments?.map((c) => {
                    const isOwn = c.user.id === user?.userId;
                    return (
                      <div key={c.id} className={cn("flex gap-2.5", isOwn && "flex-row-reverse")}>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {initials(c.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("flex-1 min-w-0", isOwn && "items-end flex flex-col")}>
                          <div
                            className={cn("flex items-baseline gap-2", isOwn && "flex-row-reverse")}
                          >
                            <span className="text-xs font-medium">
                              {isOwn ? "You" : c.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(c.createdAt)}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "text-sm mt-0.5 break-words rounded-lg px-3 py-2 max-w-[85%]",
                              isOwn
                                ? "bg-primary text-primary-foreground ml-auto"
                                : "bg-muted text-foreground"
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

              {/* Add comment input */}
              <div className="flex gap-2 shrink-0 border-t pt-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment… (Ctrl+Enter to send)"
                  rows={2}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment();
                  }}
                />
                <Button
                  size="sm"
                  className="self-end"
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
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
