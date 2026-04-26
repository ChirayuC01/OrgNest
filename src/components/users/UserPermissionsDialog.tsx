"use client";

import { useEffect, useState, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODULES = ["TASKS", "USERS", "AUDIT", "ANALYTICS", "SETTINGS"] as const;
const ACTIONS = ["READ", "WRITE", "DELETE", "MANAGE"] as const;
type Module = (typeof MODULES)[number];
type Action = (typeof ACTIONS)[number];

interface Override {
  module: Module;
  action: Action;
  granted: boolean;
}

interface ResolvedPermissions {
  [key: string]: boolean;
}

interface UserPermissionsDialogProps {
  userId: string;
  userName: string;
  userRole: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPermissionsDialog({
  userId,
  userName,
  userRole,
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const [resolved, setResolved] = useState<ResolvedPermissions>({});
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    startTransition(() => setLoading(true));
    fetch(`/api/users/${userId}/permissions`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setResolved(json.data.resolved);
          setOverrides(json.data.overrides);
        }
      })
      .finally(() => setLoading(false));
  }, [open, userId]);

  const isOverridden = (module: Module, action: Action) =>
    overrides.some((o) => o.module === module && o.action === action);

  const getGranted = (module: Module, action: Action) => resolved[`${module}.${action}`] ?? false;

  const handleToggle = async (module: Module, action: Action, newGranted: boolean) => {
    const key = `${module}.${action}`;
    setSaving(key);
    try {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ module, action, granted: newGranted }),
      });
      const json = await res.json();
      if (res.ok) {
        setResolved((prev) => ({ ...prev, [key]: newGranted }));
        setOverrides((prev) => {
          const existing = prev.findIndex((o) => o.module === module && o.action === action);
          if (existing >= 0) {
            return prev.map((o, i) => (i === existing ? { ...o, granted: newGranted } : o));
          }
          return [...prev, { module, action, granted: newGranted }];
        });
        toast.success(`${module}.${action} ${newGranted ? "granted" : "revoked"}`);
      } else {
        toast.error(json.error || "Failed to update permission");
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissions — {userName}</DialogTitle>
          <DialogDescription>
            Role: <span className="font-medium text-foreground">{userRole}</span>. Blue toggles are
            overrides; gray reflects the role default.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-32">
                    Module
                  </th>
                  {ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="text-center py-2 px-3 font-medium text-muted-foreground"
                    >
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODULES.map((module) => (
                  <tr key={module}>
                    <td className="py-3 pr-4 font-medium">{module}</td>
                    {ACTIONS.map((action) => {
                      const key = `${module}.${action}`;
                      const granted = getGranted(module, action);
                      const overridden = isOverridden(module, action);
                      return (
                        <td key={action} className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Switch
                              checked={granted}
                              onCheckedChange={(v) => handleToggle(module, action, v)}
                              disabled={saving === key}
                              className={cn(overridden && "data-[state=checked]:bg-primary")}
                            />
                            {overridden && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                override
                              </Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
