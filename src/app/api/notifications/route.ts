/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get recent audit activity as notifications (last 20 events, auth required)
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of recent activity items
 */
import { authMiddleware } from "@/server/middleware/auth";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  try {
    const user = await authMiddleware();

    const logs = await prisma.auditLog.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    const notifications = logs.map((l) => ({
      id: l.id,
      message: `${l.user?.name ?? "Someone"} ${l.action.toLowerCase()}d a ${l.entity.toLowerCase()}`,
      createdAt: l.createdAt,
      read: false, // stateless — client tracks read state in memory
    }));

    return success(notifications);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
