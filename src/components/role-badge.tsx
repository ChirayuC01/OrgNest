import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

const roleConfig: Record<Role, { label: string; className: string }> = {
  ADMIN:    { label: "Admin",    className: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  MANAGER:  { label: "Manager",  className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  EMPLOYEE: { label: "Employee", className: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
};

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role as Role] ?? {
    label: role,
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  };
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
