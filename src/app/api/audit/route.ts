import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  const authResult = await requirePermission("AUDIT", "READ");
  if (authResult instanceof Response) return authResult;

  const logs = await prisma.auditLog.findMany({
    where: { tenantId: authResult.tenantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return success(logs);
}
