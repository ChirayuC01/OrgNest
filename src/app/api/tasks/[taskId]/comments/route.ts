import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 2000 }
 *     responses:
 *       201:
 *         description: Comment created
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const { taskId } = await params;
  const isEmployee = authResult.role === "EMPLOYEE";

  // Verify task exists and user can access it
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      tenantId: authResult.tenantId,
      ...(isEmployee && { assignedToId: authResult.userId }),
    },
    select: { id: true },
  });
  if (!task) return error("Task not found", 404, "NOT_FOUND");

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      userId: authResult.userId,
      content: parsed.data.content,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return success(comment, 201);
}
