import { authMiddleware } from "@/server/middleware/auth";
import { resolveAllPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/helper/apiResponse";

export async function GET(req: Request) {
    try {
        const token = await authMiddleware(req);

        const user = await prisma.user.findUnique({
            where: { id: token.userId },
            select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true },
        });

        if (!user || !user.isActive) {
            return error("Unauthorized", 401);
        }

        const permissions = await resolveAllPermissions(user.id, user.role);

        return success({ user, permissions });
    } catch {
        return error("Unauthorized", 401);
    }
}
