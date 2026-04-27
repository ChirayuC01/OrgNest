import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

// ─── Status transition rules ──────────────────────────────────────────────────
// Employee:  can move to IN_REVIEW only
// Manager:   can move to DONE (from IN_REVIEW) or any non-DONE status
// Admin:     unrestricted

const ALLOWED_EMPLOYEE_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: [],
  DONE: [],
};

const ALLOWED_MANAGER_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS"],
  DONE: ["IN_REVIEW"],
};

function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  role: string
): string | null {
  if (role === "ADMIN") return null; // Admins unrestricted

  const allowed =
    role === "MANAGER"
      ? (ALLOWED_MANAGER_TRANSITIONS[currentStatus] ?? [])
      : (ALLOWED_EMPLOYEE_TRANSITIONS[currentStatus] ?? []);

  if (!allowed.includes(newStatus)) {
    if (role === "EMPLOYEE") {
      return `Employees can only move tasks forward in the workflow. Allowed next step: ${allowed.join(", ") || "none"}`;
    }
    return `Cannot move task from ${currentStatus} to ${newStatus}`;
  }
  return null;
}

// Full update schema for manager/admin
const patchTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

// Employees may only change status
const employeePatchSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
});

// Task include shape for consistent responses
const taskInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  assignedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  labels: { include: { label: true } },
  subtasks: { orderBy: { position: "asc" as const } },
} as const;

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Get a single task with history, comments, labels and subtasks
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
export async function GET(_req: Request, { params }: { params: { taskId: string } }) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = params;

  const isEmployee = authResult.role === "EMPLOYEE";

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      // Employees can only view tasks assigned to them
      ...(isEmployee && { assignedToId: authResult.userId }),
    },
    include: {
      ...taskInclude,
      history: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
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
 *     summary: Update a task — managers/admins can edit all fields, employees can only change status (with transition rules)
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
export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = params;
  const isEmployee = authResult.role === "EMPLOYEE";

  const existing = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      ...(isEmployee && { assignedToId: authResult.userId }),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    // Select createdById for notification purposes
  });
  if (!existing) return error("Task not found", 404, "NOT_FOUND");

  const body = await req.json();

  // ── Employee path (status only) ────────────────────────────────────────────
  if (isEmployee) {
    const parsed = employeePatchSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

    const newStatus = parsed.data.status;
    const oldStatus = existing.status;

    // Enforce transition rules
    const transitionError = validateStatusTransition(oldStatus, newStatus, "EMPLOYEE");
    if (transitionError) return error(transitionError, 403, "INVALID_TRANSITION");

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: taskInclude,
    });

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

      // Notify the task creator and assignee (if different from changer)
      const notifyUserIds = [
        ...new Set(
          [existing.assignedToId, existing.createdById].filter(
            (id): id is string => !!id && id !== authResult.userId
          )
        ),
      ];
      if (notifyUserIds.length > 0) {
        await prisma.notification.createMany({
          data: notifyUserIds.map((userId) => ({
            userId,
            tenantId: authResult.tenantId,
            type: "TASK_STATUS_CHANGED" as const,
            title: "Task status updated",
            message: `"${existing.title}" moved from ${oldStatus.replace("_", " ")} to ${newStatus.replace("_", " ")}`,
            taskId,
          })),
        });
      }
    }

    return success(task);
  }

  // ── Manager / Admin path ───────────────────────────────────────────────────
  const writeCheck = await requirePermission("TASKS", "WRITE");
  if (writeCheck instanceof Response) return writeCheck;

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const data = parsed.data;

  // Enforce status transition rules for managers too
  if (data.status && data.status !== existing.status) {
    const transitionError = validateStatusTransition(existing.status, data.status, authResult.role);
    if (transitionError) return error(transitionError, 403, "INVALID_TRANSITION");
  }

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
    // Resolve new assignee name so history stores human-readable values, not raw IDs
    let newAssigneeName: string | null = null;
    if (data.assignedToId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { name: true },
      });
      newAssigneeName = newAssignee?.name ?? data.assignedToId;
    }
    changes.push({
      field: FIELD_LABELS.assignedToId,
      oldValue: existing.assignedTo?.name ?? existing.assignedToId ?? null,
      newValue: newAssigneeName,
    });
  }
  if (data.dueDate !== undefined) {
    const oldDue = existing.dueDate ? existing.dueDate.toISOString().slice(0, 10) : null;
    const newDue = data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : null;
    if (oldDue !== newDue) {
      changes.push({ field: FIELD_LABELS.dueDate, oldValue: oldDue, newValue: newDue });
    }
  }

  // Determine assignedById if assignee is changing
  const assignedByIdUpdate =
    data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId
      ? { assignedById: data.assignedToId ? authResult.userId : null }
      : {};

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
      ...assignedByIdUpdate,
    },
    include: taskInclude,
  });

  // Update labels if provided
  if (data.labelIds !== undefined) {
    await prisma.taskLabel.deleteMany({ where: { taskId } });
    if (data.labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: data.labelIds.map((labelId) => ({ taskId, labelId })),
        skipDuplicates: true,
      });
    }
  }

  // Persist history
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

  // Notify newly assigned user
  if (
    data.assignedToId &&
    data.assignedToId !== existing.assignedToId &&
    data.assignedToId !== authResult.userId
  ) {
    await prisma.notification.create({
      data: {
        userId: data.assignedToId,
        tenantId: authResult.tenantId,
        type: "TASK_ASSIGNED",
        title: "You've been assigned a task",
        message: `You were assigned to "${task.title}"`,
        taskId,
      },
    });
  }

  // Notify on status change
  if (data.status && data.status !== existing.status) {
    const notifyUserIds = [
      ...new Set(
        [task.assignedToId, existing.createdById].filter(
          (id): id is string => !!id && id !== authResult.userId
        )
      ),
    ];
    if (notifyUserIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyUserIds.map((userId) => ({
          userId,
          tenantId: authResult.tenantId,
          type: "TASK_STATUS_CHANGED" as const,
          title: "Task status updated",
          message: `"${task.title}" moved from ${existing.status.replace(/_/g, " ")} to ${data.status!.replace(/_/g, " ")}`,
          taskId,
        })),
      });
    }
  }

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
export async function DELETE(_req: Request, { params }: { params: { taskId: string } }) {
  const authResult = await requirePermission("TASKS", "DELETE");
  if (authResult instanceof Response) return authResult;

  const { taskId } = params;

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
