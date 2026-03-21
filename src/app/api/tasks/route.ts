import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";

// GET (any logged-in user)
export async function GET(req: Request) {
    try {
        const user = await requireAuth(req);

        const tasks = await prisma.task.findMany({
            where: {
                tenantId: user.tenantId,
            },
        });

        return Response.json(tasks);
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

        return Response.json(task);
    } catch (error: any) {
        return Response.json(
            { error: error.message },
            { status: 403 }
        );
    }
}