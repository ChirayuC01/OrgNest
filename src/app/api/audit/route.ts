import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  try {
    const user = await requireAuth();

    const logs = await prisma.auditLog.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return success(logs);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
