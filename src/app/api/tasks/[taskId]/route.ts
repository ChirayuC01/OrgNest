import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

const patchTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId, tenantId: authResult.tenantId },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  if (!task) return error("Task not found", 404, "NOT_FOUND");

  return success(task);
}

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   patch:
 *     summary: Update a task (partial update)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchTask'
 *     responses:
 *       200:
 *         description: Updated task
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const authResult = await requirePermission("TASKS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;

  const existing = await prisma.task.findUnique({
    where: { id: taskId, tenantId: authResult.tenantId },
    select: { id: true },
  });
  if (!existing) return error("Task not found", 404, "NOT_FOUND");

  const body = await req.json();
  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const data = parsed.data;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  await createAuditLog({
    action: "UPDATE_TASK",
    entity: "Task",
    entityId: task.id,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { changes: data },
  });

  return success(task);
}

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const authResult = await requirePermission("TASKS", "DELETE");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;

  const existing = await prisma.task.findUnique({
    where: { id: taskId, tenantId: authResult.tenantId },
    select: { id: true, title: true },
  });
  if (!existing) return error("Task not found", 404, "NOT_FOUND");

  await prisma.task.delete({ where: { id: taskId } });

  await createAuditLog({
    action: "DELETE_TASK",
    entity: "Task",
    entityId: taskId,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { title: existing.title },
  });

  return success({ message: "Task deleted successfully" });
}
