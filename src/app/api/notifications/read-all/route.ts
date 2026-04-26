import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth";
import { success, error } from "@/helper/apiResponse";

/**
 * POST /api/notifications/read-all — mark all notifications as read for current user
 */
export async function POST() {
  try {
    const auth = await authMiddleware();

    await prisma.notification.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true },
    });

    return success({ message: "All notifications marked as read" });
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
