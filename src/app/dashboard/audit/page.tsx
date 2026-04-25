"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { name: string; email: string };
};

export default function AuditPage() {
  useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/audit", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => setLogs(json.data ?? []));
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border p-3 rounded bg-white">
            <p className="font-medium">
              {log.user?.name} → {log.action}
            </p>

            <p className="text-sm text-gray-500">
              {log.entity} ({log.entityId})
            </p>

            <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
