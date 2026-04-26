"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Menu } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { RefetchIndicator } from "@/components/layout/RefetchIndicator";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Tasks",
  "/dashboard/team": "Team",
  "/dashboard/audit": "Audit Logs",
  "/dashboard/analytics": "Analytics",
  "/dashboard/profile": "Profile",
};

function roleBadgeVariant(role: string) {
  if (role === "ADMIN") return "default" as const;
  if (role === "MANAGER") return "secondary" as const;
  return "outline" as const;
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const breadcrumb = breadcrumbMap[pathname] ?? "Dashboard";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur flex items-center px-4 gap-4 shrink-0">
      {/* Mobile menu button */}
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <h1 className="font-semibold text-base flex-1">{breadcrumb}</h1>

      <div className="flex items-center gap-2">
        <RefetchIndicator />
        <NotificationBell />
        <ThemeToggle />

        <DropdownMenu>
          {/* Use native button element in render so Base UI is satisfied */}
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-muted transition-colors outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
              {user?.name ?? user?.email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  {user?.role && (
                    <Badge variant={roleBadgeVariant(user.role)} className="w-fit text-xs mt-0.5">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
