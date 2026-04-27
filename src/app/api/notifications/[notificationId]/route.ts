import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth";
import { success, error } from "@/helper/apiResponse";

/**
 * PATCH /api/notifications/:notificationId — mark a single notification as read
 */
export async function PATCH(
  _req: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const auth = await authMiddleware();
    const { notificationId } = params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId, userId: auth.userId },
    });
    if (!notification) return error("Notification not found", 404, "NOT_FOUND");

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return success(updated);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
