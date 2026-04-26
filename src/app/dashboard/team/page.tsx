"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUsers, useCreateUser } from "@/hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPermissionsDialog } from "@/components/users/UserPermissionsDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
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
  const isManager = currentUser?.role === "MANAGER";
  const canWrite = canAccess("USERS", "WRITE");
  const qc = useQueryClient();

  const params = new URLSearchParams({ limit: "100" });
  const { data, isLoading } = useUsers(params);
  const users = data?.data ?? [];

  const createUser = useCreateUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [inviteError, setInviteError] = useState("");
  const [permTarget, setPermTarget] = useState<UserPublic | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);

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
        toast.dismiss();
      },
    });
  };

  const handleBanToggle = async (user: UserPublic) => {
    setBanningId(user.id);
    try {
      if (user.isBanned) {
        await api.delete(`/api/users/${user.id}/ban`);
        toast.success(`${user.name} has been unbanned`);
      } else {
        await api.post(`/api/users/${user.id}/ban`, {});
        toast.success(`${user.name} has been banned`);
      }
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update ban status");
    } finally {
      setBanningId(null);
    }
  };

  const canBanUser = (target: UserPublic) => {
    if (target.id === currentUser?.userId) return false;
    if (isAdmin && target.role !== "ADMIN") return true;
    if (isManager && target.role === "EMPLOYEE") return true;
    return false;
  };

  const canManagePerms = (target: UserPublic) => {
    return isAdmin && target.id !== currentUser?.userId;
  };

  // Filter visible users based on role hierarchy
  const visibleUsers = users.filter((u) => {
    if (isAdmin) return true;
    if (isManager) return u.role !== "ADMIN";
    // Employees see no one else (this page shouldn't be accessible without USERS.READ)
    return false;
  });

  if (!canAccess("USERS", "READ")) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Access restricted"
        description="You don't have permission to view team members."
      />
    );
  }

  const showActions = canWrite || isAdmin;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Team</h2>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {visibleUsers.length} {visibleUsers.length === 1 ? "member" : "members"}
            </p>
          )}
        </div>
        {canWrite && (
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
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="w-12" />}
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
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  {showActions && <TableCell />}
                </TableRow>
              ))
            ) : visibleUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 5 : 4} className="py-10 text-center">
                  <EmptyState
                    icon={Users}
                    title="No team members yet"
                    description="Add your first team member to get started."
                  />
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((user) => (
                <TableRow key={user.id} className={user.isBanned ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.name}
                      {user.id === currentUser?.userId && (
                        <span className="text-[10px] text-muted-foreground">(you)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadge[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="mr-1 h-3 w-3" /> Banned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    )}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={user.id === currentUser?.userId}
                          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors outline-none disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManagePerms(user) && (
                            <>
                              <DropdownMenuItem onClick={() => setPermTarget(user)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Manage permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canBanUser(user) && (
                            <DropdownMenuItem
                              onClick={() => handleBanToggle(user)}
                              disabled={banningId === user.id}
                              className={
                                user.isBanned
                                  ? "text-green-600"
                                  : "text-destructive focus:text-destructive"
                              }
                            >
                              {banningId === user.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : user.isBanned ? (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              ) : (
                                <Ban className="mr-2 h-4 w-4" />
                              )}
                              {user.isBanned ? "Unban user" : "Ban user"}
                            </DropdownMenuItem>
                          )}
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
                  {isAdmin && <SelectItem value="MANAGER">Manager</SelectItem>}
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
