import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  try {
    const user = await requireAuth();

    const tasks = await prisma.task.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return success(tasks);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(["ADMIN", "MANAGER"]);

    const body = await req.json();
    const { title, status, assignedTo } = body;

    if (!title) {
      return error("Title is required", 400, "VALIDATION_ERROR");
    }

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
      metadata: { title: task.title },
    });

    return success(task, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Forbidden: Access denied" ? 403 : 500;
    return error(message, status);
  }
}
