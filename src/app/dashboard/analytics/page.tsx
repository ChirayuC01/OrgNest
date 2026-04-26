"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { StatCard, StatCardSkeleton } from "@/components/analytics/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, CheckSquare, ListTodo, TrendingUp, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsData {
  tasksByStatus: { status: string; count: number }[];
  tasksByMember: { name: string; count: number }[];
  tasksCreatedPerDay: { date: string; count: number }[];
  completionRate: number;
  totalTasks: number;
  openTasks: number;
  doneTasks: number;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW: "#f59e0b",
  DONE: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const CHART_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#ec4899",
];

export default function AnalyticsPage() {
  const canAccess = useAuthStore((s) => s.canAccess);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (!canAccess("ANALYTICS", "READ")) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Access restricted"
        description="You don't have permission to view analytics."
      />
    );
  }

  // Condense daily labels to just day/month for readability
  const trendData = (data?.tasksCreatedPerDay ?? []).map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Show every 5th label to avoid crowding
  const trendDataLabeled = trendData.map((d, i) => ({
    ...d,
    displayLabel: i % 5 === 0 ? d.label : "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Last 30 days overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Tasks"
              value={data?.totalTasks ?? 0}
              subtitle="All time"
              icon={CheckSquare}
            />
            <StatCard
              title="Open Tasks"
              value={data?.openTasks ?? 0}
              subtitle="Not yet done"
              icon={ListTodo}
            />
            <StatCard
              title="Completed"
              value={data?.doneTasks ?? 0}
              subtitle="Marked as done"
              icon={TrendingUp}
            />
            <StatCard
              title="Completion Rate"
              value={`${data?.completionRate ?? 0}%`}
              subtitle="Done / total"
              icon={Users}
            />
          </>
        )}
      </div>

      {/* Completion progress bar */}
      {!loading && data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={data.completionRate} className="flex-1 h-2" />
              <span className="text-sm font-semibold w-10 text-right">{data.completionRate}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by status — pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data?.tasksByStatus.map((d) => ({
                      name: STATUS_LABELS[d.status] ?? d.status,
                      value: d.count,
                      fill: STATUS_COLORS[d.status] ?? "#94a3b8",
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data?.tasksByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} tasks`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tasks by member — bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Member</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : data?.tasksByMember.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                No assigned tasks yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.tasksByMember} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.split(" ")[0]}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                    {data?.tasksByMember.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily trend — line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks Created — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendDataLabeled} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="displayLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0] ? (payload[0].payload as { label: string }).label : ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Tasks created"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
