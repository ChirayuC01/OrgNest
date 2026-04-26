import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

// Full update schema for manager/admin
const patchTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

// Employees may only change status
const employeePatchSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
});

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Get a single task with history and comments
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
 *         description: Task details with history and comments
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;

  const isEmployee = authResult.role === "EMPLOYEE";

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      // Employees can only view tasks assigned to them
      ...(isEmployee && { assignedToId: authResult.userId }),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!task) return error("Task not found", 404, "NOT_FOUND");

  return success(task);
}

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   patch:
 *     summary: Update a task — managers/admins can edit all fields, employees can only change status
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
export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  console.log("req---", req);
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;
  console.log("authResult---", authResult);

  const { taskId } = await params;
  const isEmployee = authResult.role === "EMPLOYEE";

  const existing = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      ...(isEmployee && { assignedToId: authResult.userId }),
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
  if (!existing) return error("Task not found", 404, "NOT_FOUND");

  const body = await req.json();
  console.log("body---", body);


  // Employees can only update status
  if (isEmployee) {
    const parsed = employeePatchSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

    const oldStatus = existing.status;
    const newStatus = parsed.data.status;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    // Record history
    if (oldStatus !== newStatus) {
      await prisma.taskHistory.create({
        data: {
          taskId,
          userId: authResult.userId,
          changes: [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
        },
      });

      await createAuditLog({
        action: "STATUS_CHANGE",
        entity: "Task",
        entityId: taskId,
        userId: authResult.userId,
        tenantId: authResult.tenantId,
        metadata: { title: existing.title, from: oldStatus, to: newStatus },
      });
    }

    return success(task);
  }

  // Managers and Admins — need WRITE permission for full edits
  const writeCheck = await requirePermission("TASKS", "WRITE");
  if (writeCheck instanceof Response) return writeCheck;

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const data = parsed.data;

  // Build history diff
  const FIELD_LABELS: Record<string, string> = {
    title: "title",
    description: "description",
    status: "status",
    priority: "priority",
    assignedToId: "assigned to",
    dueDate: "due date",
  };

  type HistoryChange = { field: string; oldValue: string | null; newValue: string | null };
  const changes: HistoryChange[] = [];

  if (data.title !== undefined && data.title !== existing.title) {
    changes.push({ field: FIELD_LABELS.title, oldValue: existing.title, newValue: data.title });
  }
  if (data.description !== undefined && data.description !== existing.description) {
    changes.push({
      field: FIELD_LABELS.description,
      oldValue: existing.description ?? null,
      newValue: data.description,
    });
  }
  if (data.status !== undefined && data.status !== existing.status) {
    changes.push({
      field: FIELD_LABELS.status,
      oldValue: existing.status,
      newValue: data.status,
    });
  }
  if (data.priority !== undefined && data.priority !== existing.priority) {
    changes.push({
      field: FIELD_LABELS.priority,
      oldValue: String(existing.priority),
      newValue: String(data.priority),
    });
  }
  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
    changes.push({
      field: FIELD_LABELS.assignedToId,
      oldValue: existing.assignedTo?.name ?? existing.assignedToId ?? null,
      newValue: data.assignedToId ?? null,
    });
  }
  if (data.dueDate !== undefined) {
    const oldDue = existing.dueDate ? existing.dueDate.toISOString().slice(0, 10) : null;
    const newDue = data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : null;
    if (oldDue !== newDue) {
      changes.push({ field: FIELD_LABELS.dueDate, oldValue: oldDue, newValue: newDue });
    }
  }

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

  // Persist history if anything actually changed
  if (changes.length > 0) {
    await prisma.taskHistory.create({
      data: { taskId, userId: authResult.userId, changes },
    });
  }

  await createAuditLog({
    action: "UPDATE_TASK",
    entity: "Task",
    entityId: task.id,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { title: task.title, changes },
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
export async function DELETE(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
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
