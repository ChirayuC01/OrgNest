"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tag, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Label } from "@/types";

const PRESET_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

interface LabelsManagerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LabelsManager({ open, onOpenChange }: LabelsManagerProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0]);

  const { data: labels = [], isLoading } = useQuery<Label[]>({
    queryKey: ["labels"],
    queryFn: () => api.get<Label[]>("/api/labels"),
    enabled: open,
  });

  const createLabel = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.post<Label>("/api/labels", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      setName("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create label"),
  });

  const deleteLabel = useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/api/labels/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
    onError: () => toast.error("Failed to delete label"),
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createLabel.mutate({ name: name.trim(), color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Manage Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Existing labels */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : labels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No labels yet</p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm font-medium">{label.name}</span>
                  </div>
                  <button
                    onClick={() => deleteLabel.mutate(label.id)}
                    disabled={deleteLabel.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Create new label */}
          <div className="space-y-3 border-t pt-3">
            <p className="text-sm font-medium">New label</p>

            <Input
              placeholder="Label name (e.g. Bug, Feature)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            {/* Color picker */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      setCustomColor(c);
                    }}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                {/* Custom color input */}
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setColor(e.target.value);
                    }}
                    className="h-6 w-6 rounded-full cursor-pointer border-2 border-dashed border-muted-foreground opacity-70 hover:opacity-100"
                    title="Custom color"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                <span className="text-xs text-muted-foreground font-mono">{color}</span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim() || createLabel.isPending}
              className="w-full"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add label
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
