"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const POLL_MS = 60_000;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.data) {
        startTransition(() => {
          setNotifications(json.data.notifications ?? []);
          setUnreadCount(json.data.unreadCount ?? 0);
        });
      }
    } finally {
      startTransition(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
    startTransition(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", credentials: "include" });
    startTransition(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    // Auto-mark all as read when opening the panel
    if (v && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors outline-none">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[480px] overflow-y-auto">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-3 py-1.5">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  markAllRead();
                }}
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            You&apos;re all caught up!
          </p>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markOneRead(n.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted/60",
                  !n.read && "bg-primary/5"
                )}
              >
                {!n.read && (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <div className={cn("flex-1 min-w-0", n.read && "pl-4")}>
                  <p className="font-medium text-xs text-muted-foreground mb-0.5">{n.title}</p>
                  <p className="leading-snug line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
