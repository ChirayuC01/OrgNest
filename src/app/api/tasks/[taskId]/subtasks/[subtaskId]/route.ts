import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

const patchSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> }
) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId, subtaskId } = await params;

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      ...(authResult.role === "EMPLOYEE" && { assignedToId: authResult.userId }),
    },
    select: { id: true },
  });
  if (!task) return error("Task not found", 404, "NOT_FOUND");

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId, taskId } });
  if (!subtask) return error("Subtask not found", 404, "NOT_FOUND");

  const body = await req.json();
  const parsed = patchSubtaskSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const updated = await prisma.subtask.update({
    where: { id: subtaskId },
    data: parsed.data,
  });

  return success(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string; subtaskId: string }> }
) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId, subtaskId } = await params;

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      ...(authResult.role === "EMPLOYEE" && { assignedToId: authResult.userId }),
    },
    select: { id: true },
  });
  if (!task) return error("Task not found", 404, "NOT_FOUND");

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId, taskId } });
  if (!subtask) return error("Subtask not found", 404, "NOT_FOUND");

  await prisma.subtask.delete({ where: { id: subtaskId } });
  return success({ message: "Subtask deleted" });
}
