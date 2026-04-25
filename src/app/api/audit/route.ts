import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { paginated, error } from "@/helper/apiResponse";
import type { Prisma } from "@prisma/client";

const auditQuerySchema = z.object({
  action: z.string().max(100).optional(),
  entity: z.string().max(100).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: List audit logs with filtering and pagination
 *     tags: [Audit]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action name (e.g. CREATE_TASK)
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *         description: Filter by entity type (e.g. Task, User)
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Filter by acting user ID
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
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
 *         description: Paginated list of audit logs
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export async function GET(req: Request) {
  const authResult = await requirePermission("AUDIT", "READ");
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL(req.url);
  const parsed = auditQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const p = parsed.data;

  const where: Prisma.AuditLogWhereInput = {
    tenantId: authResult.tenantId,
    ...(p.action && { action: { contains: p.action, mode: "insensitive" } }),
    ...(p.entity && { entity: { contains: p.entity, mode: "insensitive" } }),
    ...(p.userId && { userId: p.userId }),
    ...((p.startDate || p.endDate) && {
      createdAt: {
        ...(p.startDate && { gte: new Date(p.startDate) }),
        ...(p.endDate && { lte: new Date(p.endDate) }),
      },
    }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: p.sortOrder },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginated(logs, {
    page: p.page,
    limit: p.limit,
    total,
    totalPages: Math.ceil(total / p.limit),
    hasNext: p.page * p.limit < total,
    hasPrev: p.page > 1,
  });
}
