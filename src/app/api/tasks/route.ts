import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const tasks = await prisma.task.findMany({
    where: { tenantId: authResult.tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return success(tasks);
}

export async function POST(req: Request) {
  const authResult = await requirePermission("TASKS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const { title, description, status, priority, assignedToId, dueDate } = body;

  if (!title) return error("Title is required", 400, "VALIDATION_ERROR");

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status || "TODO",
      priority: priority ?? 2,
      tenantId: authResult.tenantId,
      assignedToId: assignedToId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await createAuditLog({
    action: "CREATE_TASK",
    entity: "Task",
    entityId: task.id,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { title: task.title, status: task.status },
  });

  return success(task, 201);
}
