"use client";

import { useState, useEffect, startTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock, MessageSquare, History, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTask, useUpdateTask, useAddComment } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import type { UserPublic } from "@/types";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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

  // Edit state (manager/admin)
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState("2");
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [editDue, setEditDue] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Comment state
  const [comment, setComment] = useState("");

  const updateTask = useUpdateTask();
  const addComment = useAddComment(taskId ?? "");

  // Sync edit form when task loads or changes
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
    updateTask.mutate({ id: taskId, status: newStatus as import("@/types").TaskStatus });
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
        status: editStatus as import("@/types").TaskStatus,
      },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("Task updated");
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

  const statusOpt =
    STATUS_OPTIONS.find((s) => s.value === (task?.status ?? "TODO")) ?? STATUS_OPTIONS[0];

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
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                History{" "}
                {(task.history?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">
                    {task.history?.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments{" "}
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
                <Label>Assigned to</Label>
                {editing && !isEmployee ? (
                  <Select
                    value={editAssignee ?? "unassigned"}
                    onValueChange={(v) => setEditAssignee(v === "unassigned" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <p className="text-xs text-muted-foreground">
                Created {formatDate(task.createdAt)} · Last updated {formatDate(task.updatedAt)}
              </p>

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

            {/* ── History tab ── */}
            <TabsContent value="history" className="mt-0 flex-1 overflow-y-auto pt-4 pr-1">
              {(task.history?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No changes recorded yet
                </p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {task.history?.map((h) => (
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
                            Changed <span className="font-medium text-foreground">{c.field}</span>
                            {c.oldValue && (
                              <>
                                {" "}
                                from <span className="line-through">{c.oldValue}</span>
                              </>
                            )}
                            {c.newValue && (
                              <>
                                {" "}
                                to <span className="font-medium text-foreground">{c.newValue}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
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
                  task.comments?.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                          {initials(c.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium">{c.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5 break-words">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment input */}
              <div className="flex gap-2 shrink-0 border-t pt-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
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
