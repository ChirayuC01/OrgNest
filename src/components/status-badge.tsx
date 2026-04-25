import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TaskStatus = "pending" | "in_progress" | "done";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending:     { label: "Pending",     className: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  done:        { label: "Done",        className: "bg-green-100 text-green-700 hover:bg-green-100" },
};

interface StatusBadgeProps {
  status: TaskStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as TaskStatus] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  };
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
