import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
  position: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /api/tasks/:taskId/subtasks
 */
export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId, tenantId: authResult.tenantId },
    select: { id: true },
  });
  if (!task) return error("Task not found", 404, "NOT_FOUND");

  const subtasks = await prisma.subtask.findMany({
    where: { taskId },
    orderBy: { position: "asc" },
  });

  return success(subtasks);
}

/**
 * POST /api/tasks/:taskId/subtasks
 */
export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      ...(authResult.role === "EMPLOYEE" && { assignedToId: authResult.userId }),
    },
    select: { id: true },
  });
  if (!task) return error("Task not found", 404, "NOT_FOUND");

  const body = await req.json();
  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  // Auto position at end if not provided
  let position = parsed.data.position;
  if (position === undefined) {
    const last = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    position = (last?.position ?? -1) + 1;
  }

  const subtask = await prisma.subtask.create({
    data: { taskId, title: parsed.data.title, position },
  });

  return success(subtask, 201);
}
