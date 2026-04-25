"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  BarChart3,
  Menu,
  LogOut,
  ExternalLink,
  ClipboardList,
} from "lucide-react";

function useNavItems() {
  const { can } = usePermissions();
  return [
    { href: "/dashboard",           label: "Tasks",      icon: LayoutDashboard, show: true },
    { href: "/dashboard/analytics", label: "Analytics",  icon: BarChart3,       show: can("ANALYTICS", "read") },
    { href: "/dashboard/team",      label: "Team",       icon: Users,           show: can("TEAM",      "read") },
    { href: "/dashboard/audit",     label: "Audit Logs", icon: ScrollText,      show: can("AUDIT",     "read") },
  ].filter((item) => item.show);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname  = usePathname();
  const navItems  = useNavItems();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  function handleLogout() {
    logout();
    // Clear cookie by calling logout endpoint (cookie cleared server-side in a later phase)
    document.cookie = "token=; Max-Age=0; Path=/";
    router.push("/login");
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 font-semibold">
        <ClipboardList className="h-5 w-5 text-indigo-500" />
        OrgNest
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* API Docs link */}
      <div className="px-3 py-2">
        <Link
          href="/docs"
          target="_blank"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          API Docs <ExternalLink className="h-3 w-3 ml-auto" />
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User footer */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {user ? (
            <>
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.role}</p>
            </>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:text-destructive"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuth(); // Redirect to /login if unauthenticated, loads permissions into store
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r">
        <SidebarContent />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex md:hidden items-center gap-3 border-b px-4 py-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">OrgNest</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
