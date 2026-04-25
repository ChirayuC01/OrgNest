import { authMiddleware } from "@/server/middleware/auth";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  try {
    const token = await authMiddleware();

    // Fetch fresh user data (name, email) to complement the JWT payload
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { id: true, name: true, email: true, role: true, tenantId: true },
    });

    if (!user) return error("User not found", 404, "NOT_FOUND");

    return success({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
