import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";

export async function GET(req: Request) {
    try {
        const user = await requireAuth(req);

        const logs = await prisma.auditLog.findMany({
            where: {
                tenantId: user.tenantId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return Response.json(logs);
    } catch (err: any) {
        return Response.json(
            { error: err.message },
            { status: 401 }
        );
    }
}