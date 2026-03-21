import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth";

export async function GET(req: Request) {
    try {
        const user = await authMiddleware(req);

        const tasks = await prisma.task.findMany({
            where: {
                tenantId: user.tenantId,
            },
        });

        return Response.json(tasks);
    } catch (error: any) {
        return Response.json(
            { error: error.message || "Unauthorized" },
            { status: 401 }
        );
    }
}