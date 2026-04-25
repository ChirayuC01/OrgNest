import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, paginated, error } from "@/helper/apiResponse";
import type { Prisma } from "@prisma/client";

const taskQuerySchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  assignedToId: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
  search: z.string().max(100).optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "dueDate", "priority", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.coerce.number().int().min(1).max(3).default(2),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List tasks with filtering, sorting, and pagination
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *       - in: query
 *         name: assignedToId
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: integer, minimum: 1, maximum: 3 }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *         description: Full-text search on title and description
 *       - in: query
 *         name: dueBefore
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dueAfter
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, priority, title]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedTasks'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export async function GET(req: Request) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL(req.url);
  const parsed = taskQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const p = parsed.data;

  const where: Prisma.TaskWhereInput = {
    tenantId: authResult.tenantId,
    ...(p.status && { status: p.status }),
    ...(p.assignedToId && { assignedToId: p.assignedToId }),
    ...(p.priority && { priority: p.priority }),
    ...(p.search && {
      OR: [
        { title: { contains: p.search, mode: "insensitive" } },
        { description: { contains: p.search, mode: "insensitive" } },
      ],
    }),
    ...((p.dueBefore || p.dueAfter) && {
      dueDate: {
        ...(p.dueBefore && { lte: new Date(p.dueBefore) }),
        ...(p.dueAfter && { gte: new Date(p.dueAfter) }),
      },
    }),
  };

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: { [p.sortBy]: p.sortOrder },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    }),
    prisma.task.count({ where }),
  ]);

  return paginated(tasks, {
    page: p.page,
    limit: p.limit,
    total,
    totalPages: Math.ceil(total / p.limit),
    hasNext: p.page * p.limit < total,
    hasPrev: p.page > 1,
  });
}

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export async function POST(req: Request) {
  const authResult = await requirePermission("TASKS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const { title, description, status, priority, assignedToId, dueDate } = parsed.data;

  // Verify assignedToId belongs to same tenant
  if (assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId, tenantId: authResult.tenantId },
      select: { id: true },
    });
    if (!assignee) return error("Assigned user not found in your organization", 404, "NOT_FOUND");
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      tenantId: authResult.tenantId,
      assignedToId: assignedToId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
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
