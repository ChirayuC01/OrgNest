/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's persistent notifications
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Notifications and unread count
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth";
import { success, error } from "@/helper/apiResponse";
import { withLogging } from "@/lib/withLogging";

const querySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = withLogging(async (req: Request) => {
  try {
    const auth = await authMiddleware();
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

    const { unreadOnly, limit } = parsed.data;

    const [notifications, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: {
          userId: auth.userId,
          ...(unreadOnly && { read: false }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: auth.userId, read: false },
      }),
    ]);

    return success({ notifications, unreadCount });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "Unauthorized" || err.message === "Account suspended")
    ) {
      return error(err.message, 401, "UNAUTHORIZED");
    }
    return error("Internal server error", 500, "SERVER_ERROR");
  }
});
