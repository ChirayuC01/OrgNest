/**
 * @swagger
 * /api/tasks/stream:
 *   get:
 *     summary: Server-Sent Events stream for real-time task updates
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     description: Establishes an SSE connection. Emits a `tasks` event every 30 seconds with the latest task list for the tenant (same filters as GET /api/tasks but no pagination — returns up to 200 tasks).
 *     responses:
 *       200:
 *         description: SSE stream (text/event-stream)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { authMiddleware } from "@/server/middleware/auth";
import { prisma } from "@/lib/prisma";

const POLL_MS = 30_000;

export async function GET() {
  let user: Awaited<ReturnType<typeof authMiddleware>>;
  try {
    user = await authMiddleware();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { tenantId } = user;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const tasks = await prisma.task.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 200,
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              updatedAt: true,
              assignedTo: { select: { name: true, email: true } },
            },
          });

          const payload = `event: tasks\ndata: ${JSON.stringify(tasks)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // DB error — keep stream alive, client will retry
        }
      };

      // Send immediately on connect
      await send();

      // Then poll every 30s
      const interval = setInterval(send, POLL_MS);

      // Cleanup when client disconnects
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
