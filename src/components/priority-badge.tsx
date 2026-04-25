import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Priority = "LOW" | "MEDIUM" | "HIGH";

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  LOW:    { label: "Low",    className: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  HIGH:   { label: "High",   className: "bg-red-100 text-red-700 hover:bg-red-100" },
};

interface PriorityBadgeProps {
  priority: Priority | string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority as Priority] ?? {
    label: priority,
    className: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  };
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
