"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, ClipboardList, BarChart3, Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tasks", icon: LayoutDashboard, module: "TASKS" as const },
  { href: "/dashboard/team", label: "Team", icon: Users, module: "USERS" as const },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    module: "ANALYTICS" as const,
  },
  { href: "/dashboard/audit", label: "Audit Logs", icon: ClipboardList, module: "AUDIT" as const },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const canAccess = useAuthStore((state) => state.canAccess);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">OrgNest</span>
        </div>
        {user && <p className="mt-2 text-xs text-muted-foreground truncate">{user.email}</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          if (!canAccess(item.module, "READ")) return null;
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
