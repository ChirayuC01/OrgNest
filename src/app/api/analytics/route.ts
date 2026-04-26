/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics data for the tenant (ANALYTICS.READ required)
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Aggregated analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasksByStatus:
 *                       type: array
 *                       items: { type: object }
 *                     tasksByMember:
 *                       type: array
 *                       items: { type: object }
 *                     tasksCreatedPerDay:
 *                       type: array
 *                       items: { type: object }
 *                     completionRate: { type: number }
 *                     totalTasks: { type: number }
 *                     openTasks: { type: number }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success } from "@/helper/apiResponse";

export async function GET() {
  const authResult = await requirePermission("ANALYTICS", "READ");
  if (authResult instanceof Response) return authResult;

  const { tenantId } = authResult;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all queries in parallel
  const [statusGroups, memberGroups, recentTasks, totalTasks, doneTasks] = await Promise.all([
    // Tasks grouped by status
    prisma.task.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
    }),

    // Tasks grouped by assignee (top 10)
    prisma.task.groupBy({
      by: ["assignedToId"],
      where: { tenantId, assignedToId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    // All tasks in last 30 days (for daily trend)
    prisma.task.findMany({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Total task count
    prisma.task.count({ where: { tenantId } }),

    // Done task count
    prisma.task.count({ where: { tenantId, status: "DONE" } }),
  ]);

  // Resolve assignee names
  const assigneeIds = memberGroups
    .map((g: any) => g.assignedToId)
    .filter((id: any): id is string => id !== null);

  const assignees = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });
  const assigneeMap = Object.fromEntries(assignees.map((u: any) => [u.id, u.name]));

  // Build daily trend (bucket by date string)
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = 0;
  }
  for (const task of recentTasks) {
    const key = task.createdAt.toISOString().slice(0, 10);
    if (key in dailyMap) dailyMap[key]++;
  }

  const tasksCreatedPerDay = Object.entries(dailyMap).map(([date, count]) => ({
    date,
    count,
  }));

  const tasksByStatus = statusGroups.map((g: any) => ({
    status: g.status,
    count: g._count.id,
  }));

  const tasksByMember = memberGroups.map((g: any) => ({
    name: assigneeMap[g.assignedToId!] ?? "Unknown",
    count: g._count.id,
  }));

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const openTasks = totalTasks - doneTasks;

  return success({
    tasksByStatus,
    tasksByMember,
    tasksCreatedPerDay,
    completionRate,
    totalTasks,
    openTasks,
    doneTasks,
  });
}
