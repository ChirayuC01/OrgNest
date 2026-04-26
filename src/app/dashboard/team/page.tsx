"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUsers, useCreateUser } from "@/hooks/useUsers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPermissionsDialog } from "@/components/users/UserPermissionsDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, MoreHorizontal, Plus, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import type { UserPublic, UserRole } from "@/types";

const roleBadge: Record<UserRole, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  EMPLOYEE: "outline",
};

export default function TeamPage() {
  const canAccess = useAuthStore((s) => s.canAccess);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const params = new URLSearchParams({ limit: "100" });
  const { data, isLoading } = useUsers(params);
  const users = data?.data ?? [];

  const createUser = useCreateUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [inviteError, setInviteError] = useState("");
  const [permTarget, setPermTarget] = useState<UserPublic | null>(null);

  const handleInvite = async () => {
    if (!form.name || !form.email || !form.password) {
      setInviteError("All fields are required.");
      return;
    }
    setInviteError("");
    createUser.mutate(form, {
      onSuccess: () => {
        setForm({ name: "", email: "", password: "", role: "EMPLOYEE" });
        setInviteOpen(false);
      },
      onError: (err) => {
        setInviteError(err instanceof Error ? err.message : "Failed to add user.");
        // suppress the default toast since we show inline error
        toast.dismiss();
      },
    });
  };

  if (!canAccess("USERS", "READ")) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Access restricted"
        description="You don't have permission to view team members."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Team</h2>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {users.length} {users.length === 1 ? "member" : "members"}
            </p>
          )}
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add member
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {isAdmin && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  {isAdmin && <TableCell />}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="py-10 text-center">
                  <EmptyState
                    icon={Users}
                    title="No team members yet"
                    description="Add your first team member to get started."
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadge[user.role]}>{user.role}</Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPermTarget(user)}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Manage permissions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(v) => {
          setInviteOpen(v);
          if (!v) setInviteError("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {inviteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={createUser.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={createUser.isPending}>
              {createUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                "Add member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {permTarget && (
        <UserPermissionsDialog
          userId={permTarget.id}
          userName={permTarget.name}
          userRole={permTarget.role}
          open={!!permTarget}
          onOpenChange={(v) => {
            if (!v) setPermTarget(null);
          }}
        />
      )}
    </div>
  );
}
