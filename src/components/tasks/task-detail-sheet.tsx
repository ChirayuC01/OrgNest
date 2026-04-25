"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useTaskStore } from "@/store/taskStore";
import { useUserStore } from "@/store/userStore";
import type { Task } from "@/store/taskStore";

interface TaskDetailSheetProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailSheet({ task, onClose }: TaskDetailSheetProps) {
  const { can }              = usePermissions();
  const updateTask           = useTaskStore((s) => s.updateTaskInStore);
  const removeTask           = useTaskStore((s) => s.removeTaskFromStore);
  const { users, fetchUsers} = useUserStore();

  const [form, setForm]           = useState({ title: "", description: "", status: "", priority: "", dueDate: "", assignedToId: "" });
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmOpen, setConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title:        task.title,
        description:  task.description ?? "",
        status:       task.status,
        priority:     task.priority,
        dueDate:      task.dueDate ? task.dueDate.slice(0, 10) : "",
        assignedToId: task.assignedToId ?? "",
      });
    }
  }, [task?.id]);

  useEffect(() => { fetchUsers(); }, []);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title:        form.title,
          description:  form.description || undefined,
          status:       form.status,
          priority:     form.priority,
          dueDate:      form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          assignedToId: form.assignedToId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        updateTask(data.data);
        toast.success("Task updated");
      } else {
        toast.error(data.error ?? "Failed to update task");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        removeTask(task.id);
        toast.success("Task deleted");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to delete task");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  }

  const canWrite  = can("TASKS", "write");
  const canDelete = can("TASKS", "delete");

  return (
    <>
      <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-base">Task details</SheetTitle>
          </SheetHeader>

          {task && (
            <div className="flex-1 flex flex-col gap-4 pt-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={set("title")} disabled={!canWrite} />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={set("description")}
                  disabled={!canWrite}
                  rows={3}
                  placeholder="Add a description…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))} disabled={!canWrite}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))} disabled={!canWrite}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={form.dueDate} onChange={set("dueDate")} disabled={!canWrite} />
              </div>

              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select value={form.assignedToId || "unassigned"} onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v === "unassigned" ? "" : v }))} disabled={!canWrite}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 pt-2">
                <p>Created {new Date(task.createdAt).toLocaleString()}</p>
                {task.updatedAt !== task.createdAt && (
                  <p>Updated {new Date(task.updatedAt).toLocaleString()}</p>
                )}
              </div>

              {(canWrite || canDelete) && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between gap-3 pb-2">
                    {canDelete && (
                      <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
                        Delete task
                      </Button>
                    )}
                    {canWrite && (
                      <Button className="ml-auto" size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirm}
        title="Delete task?"
        description="This action cannot be undone. The task will be permanently deleted."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
