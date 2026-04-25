import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { hashPassword } from "@/lib/hash";
import { createAuditLog } from "@/lib/audit";
import { success, paginated, error } from "@/helper/apiResponse";
import type { Prisma } from "@prisma/client";

const userQuerySchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["name", "email", "role", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["MANAGER", "EMPLOYEE"]),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users with filtering, sorting, and pagination
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, MANAGER, EMPLOYEE] }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *         description: Search on name and email
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, email, role, createdAt], default: createdAt }
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
 *         description: Paginated list of users
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
export async function GET(req: Request) {
  const authResult = await requirePermission("USERS", "READ");
  if (authResult instanceof Response) return authResult;

  const { searchParams } = new URL(req.url);
  const parsed = userQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const p = parsed.data;

  const where: Prisma.UserWhereInput = {
    tenantId: authResult.tenantId,
    ...(p.role && { role: p.role }),
    ...(p.search && {
      OR: [
        { name: { contains: p.search, mode: "insensitive" } },
        { email: { contains: p.search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { [p.sortBy]: p.sortOrder },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(users, {
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
 * /api/users:
 *   post:
 *     summary: Invite a new user to the organization
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
export async function POST(req: Request) {
  const authResult = await requirePermission("USERS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const { name, email, password, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return error("An account with this email already exists", 409, "EMAIL_TAKEN");

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, tenantId: authResult.tenantId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await createAuditLog({
    action: "CREATE_USER",
    entity: "User",
    entityId: user.id,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { email: user.email, role: user.role },
  });

  return success(user, 201);
}
