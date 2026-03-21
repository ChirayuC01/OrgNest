import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";

// GET (any logged-in user)
export async function GET(req: Request) {
    try {
        const user = await requireAuth(req);

        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get("page") || "1");
        const limit = 5;

        const tasks = await prisma.task.findMany({
            where: {
                tenantId: user.tenantId,
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
        });

        return Response.json({ tasks });
    } catch (error: any) {
        return Response.json(
            { error: error.message },
            { status: 401 }
        );
    }
}

// POST (only ADMIN + MANAGER)
export async function POST(req: Request) {
    try {
        const user = await requireAuth(req, ["ADMIN", "MANAGER"]);

        const body = await req.json();
        const { title, status, assignedTo } = body;

        const task = await prisma.task.create({
            data: {
                title,
                status: status || "pending",
                tenantId: user.tenantId,
                assignedTo,
            },
        });

        await createAuditLog({
            action: "CREATE_TASK",
            entity: "Task",
            entityId: task.id,
            userId: user.userId,
            tenantId: user.tenantId,
            metadata: {
                title: task.title,
            },
        });

        return Response.json(task);
    } catch (error: any) {
        return Response.json(
            { error: error.message },
            { status: 403 }
        );
    }
}