/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get recent task activity as notifications
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of recent task activity items
 */
import { authMiddleware } from "@/server/middleware/auth";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/helper/apiResponse";

const TASK_ACTIONS = ["CREATE_TASK", "UPDATE_TASK", "DELETE_TASK", "STATUS_CHANGE"];

const ACTION_LABEL: Record<string, string> = {
  CREATE_TASK: "created a task",
  UPDATE_TASK: "updated a task",
  DELETE_TASK: "deleted a task",
  STATUS_CHANGE: "changed task status",
};

export async function GET() {
  try {
    const user = await authMiddleware();

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: user.tenantId,
        action: { in: TASK_ACTIONS },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        entity: true,
        metadata: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    const notifications = logs.map((l) => {
      const meta = l.metadata as Record<string, unknown> | null;
      const taskTitle =
        typeof meta?.title === "string"
          ? ` "${meta.title}"`
          : typeof meta?.changes === "object" && meta.changes !== null
            ? ""
            : "";
      const verb = ACTION_LABEL[l.action] ?? l.action.toLowerCase().replace(/_/g, " ");
      return {
        id: l.id,
        message: `${l.user?.name ?? "Someone"} ${verb}${taskTitle}`,
        createdAt: l.createdAt,
        read: false,
      };
    });

    return success(notifications);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
