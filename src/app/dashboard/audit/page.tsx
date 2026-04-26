"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ClipboardList, ChevronLeft, ChevronRight, Search, X, ShieldCheck, Download } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
};

interface PaginationMeta {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  LOGIN: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export default function AuditPage() {
  const canAccess = useAuthStore((s) => s.canAccess);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", sortOrder: "desc" });
      if (action && action !== "all") params.set("action", action);
      if (entity && entity !== "all") params.set("entity", entity);
      if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
      if (dateTo) params.set("dateTo", new Date(dateTo + "T23:59:59").toISOString());

      const res = await fetch(`/api/audit?${params}`, { credentials: "include" });
      const json = await res.json();
      if (res.ok) {
        setLogs(json.data);
        setMeta(json.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [page, action, entity, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [action, entity, dateFrom, dateTo]);

  const hasFilters =
    (action && action !== "all") || (entity && entity !== "all") || dateFrom || dateTo;

  const resetFilters = () => {
    setAction("all");
    setEntity("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const filteredLogs = search
    ? logs.filter(
        (l) =>
          l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          l.entity.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const handleExportCSV = () => {
    const rows = filteredLogs.map((l) => ({
      User: l.user?.name ?? "Unknown",
      Email: l.user?.email ?? "",
      Action: l.action,
      Entity: l.entity,
      "Entity ID": l.entityId ?? "",
      Time: new Date(l.createdAt).toLocaleString(),
    }));
    exportToCSV(rows, `orgnest-audit-${new Date().toISOString().slice(0, 10)}`);
    toast.success("CSV exported");
  };

  const handleExportPDF = async () => {
    const columns = ["User", "Email", "Action", "Entity", "Entity ID", "Time"];
    const rows = filteredLogs.map((l) => [
      l.user?.name ?? "Unknown",
      l.user?.email ?? "",
      l.action,
      l.entity,
      l.entityId ? l.entityId.slice(0, 8) : "—",
      new Date(l.createdAt).toLocaleString(),
    ]);
    await exportToPDF(columns, rows, "OrgNest — Audit Log Export", `orgnest-audit-${new Date().toISOString().slice(0, 10)}`);
    toast.success("PDF exported");
  };

  if (!canAccess("AUDIT", "READ")) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Access restricted"
        description="You don't have permission to view audit logs."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Audit Logs</h2>
          {meta && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta.total} {meta.total === 1 ? "entry" : "entries"}
            </p>
          )}
        </div>
        {filteredLogs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 h-8 px-3 text-sm rounded-lg border border-border hover:bg-muted transition-colors outline-none">
              <Download className="h-3.5 w-3.5" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search user or entity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 w-48 text-sm"
          />
        </div>

        <Select value={action || "all"} onValueChange={(v) => v && setAction(v)}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="LOGIN">LOGIN</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entity || "all"} onValueChange={(v) => v && setEntity(v)}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            <SelectItem value="Task">Task</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Auth">Auth</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-36 text-sm"
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-36 text-sm"
            placeholder="To"
          />
        </div>

        {(hasFilters || search) && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <EmptyState
                    icon={ClipboardList}
                    title="No audit logs found"
                    description="No activity matches your current filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{log.user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        actionColors[log.action] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.entity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {log.entityId ? log.entityId.slice(0, 8) + "…" : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
