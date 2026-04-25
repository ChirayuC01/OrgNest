"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/store/taskStore";
import { useUserStore } from "@/store/userStore";

const DEFAULT_FORM = {
  title: "", description: "", priority: "MEDIUM", status: "pending", dueDate: "", assignedToId: "",
};

export function CreateTaskDialog() {
  const addTask  = useTaskStore((s) => s.addTaskToStore);
  const { users} = useUserStore();

  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<typeof DEFAULT_FORM>>({});
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof DEFAULT_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function validate() {
    const e: Partial<typeof DEFAULT_FORM> = {};
    if (!form.title.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title:        form.title,
          description:  form.description || undefined,
          priority:     form.priority,
          status:       form.status,
          dueDate:      form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          assignedToId: form.assignedToId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addTask(data.data);
        toast.success("Task created");
        setForm(DEFAULT_FORM);
        setOpen(false);
      } else {
        toast.error(data.error ?? "Failed to create task");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input id="task-title" placeholder="Task title" value={form.title} onChange={set("title")} className={errors.title ? "border-destructive" : ""} />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="Optional description…" rows={2} value={form.description} onChange={set("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={form.dueDate} onChange={set("dueDate")} />
          </div>

          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={form.assignedToId || "unassigned"} onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v === "unassigned" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create task"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
