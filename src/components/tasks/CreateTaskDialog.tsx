"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  UserCheck,
  CheckSquare,
  Flame,
  CalendarDays,
  User2,
  Tag,
  AlignLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useUsers } from "@/hooks/useUsers";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AssigneeCombobox, LabelsCombobox } from "./TaskComboboxes";
import type { UserPublic, Label as LabelType } from "@/types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do", dot: "bg-slate-400" },
  { value: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-500" },
  { value: "IN_REVIEW", label: "In Review", dot: "bg-amber-500" },
  { value: "DONE", label: "Done", dot: "bg-emerald-500" },
];

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Label>
  );
}

export function CreateTaskDialog({ open, onOpenChange, onCreated }: CreateTaskDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("2");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const teamParams = new URLSearchParams({ limit: "100", sortBy: "name", sortOrder: "asc" });
  const { data: teamData } = useUsers(teamParams);
  const teamMembers: UserPublic[] = teamData?.data ?? [];

  const { data: labels = [] } = useQuery<LabelType[]>({
    queryKey: ["labels"],
    queryFn: () => api.get<LabelType[]>("/api/labels"),
    staleTime: 60_000,
  });

  const reset = () => {
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("2");
    setDueDate("");
    setAssignedToId(null);
    setSelectedLabelIds([]);
    setError("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority: Number(priority),
          dueDate: dueDate || undefined,
          assignedToId: assignedToId || undefined,
          labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        reset();
        onOpenChange(false);
        onCreated();
      } else {
        setError(json.error || "Failed to create task.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      {/* max-w-xl gives a comfortable width — not too cramped, not too wide for a creation form */}
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CheckSquare className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">New task</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Add a task to your board</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[65vh]">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div>
            <SectionLabel icon={null}>
              Title <span className="text-red-500 ml-0.5">*</span>
            </SectionLabel>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
              className="h-10 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <SectionLabel icon={<AlignLeft className="h-4 w-4" />}>Description</SectionLabel>
            <Textarea
              placeholder="Add more context or steps…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="text-sm resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionLabel
                icon={<span className="h-2 w-2 rounded-full bg-current inline-block" />}
              >
                Status
              </SectionLabel>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="h-10 text-sm w-full">
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
            </div>

            <div>
              <SectionLabel icon={<Flame className="h-4 w-4" />}>Priority</SectionLabel>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger className="h-10 text-sm w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <span className="text-slate-500">Low</span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="text-amber-600">Medium</span>
                  </SelectItem>
                  <SelectItem value="3">
                    <span className="text-red-600">High</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <SectionLabel icon={<CalendarDays className="h-4 w-4" />}>Due date</SectionLabel>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Assignee */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel icon={<User2 className="h-4 w-4" />}>Assign to</SectionLabel>
              {user && assignedToId !== user.userId && (
                <button
                  type="button"
                  onClick={() => setAssignedToId(user.userId)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Assign to me
                </button>
              )}
            </div>
            <AssigneeCombobox
              members={teamMembers}
              value={assignedToId}
              onChange={setAssignedToId}
            />
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <SectionLabel icon={<Tag className="h-4 w-4" />}>Labels</SectionLabel>
              <LabelsCombobox
                labels={labels}
                value={selectedLabelIds}
                onChange={setSelectedLabelIds}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="gap-2 min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Create task
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
