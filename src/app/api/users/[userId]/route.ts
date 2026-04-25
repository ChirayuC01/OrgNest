import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

const patchUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
});

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission("USERS", "READ");
  if (authResult instanceof Response) return authResult;

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId, tenantId: authResult.tenantId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) return error("User not found", 404, "NOT_FOUND");

  return success(user);
}

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Update a user's name or role
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchUser'
 *     responses:
 *       200:
 *         description: Updated user
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission("USERS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const { userId } = await params;

  const existing = await prisma.user.findUnique({
    where: { id: userId, tenantId: authResult.tenantId },
    select: { id: true, role: true },
  });
  if (!existing) return error("User not found", 404, "NOT_FOUND");

  const body = await req.json();
  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const data = parsed.data;

  // Prevent downgrading the only admin
  if (data.role && data.role !== "ADMIN" && existing.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { tenantId: authResult.tenantId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return error("Cannot change role of the only admin in the organization", 400, "LAST_ADMIN");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await createAuditLog({
    action: "UPDATE_USER",
    entity: "User",
    entityId: user.id,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { changes: data },
  });

  return success(user);
}

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete a user from the organization
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requirePermission("USERS", "DELETE");
  if (authResult instanceof Response) return authResult;

  const { userId } = await params;

  if (userId === authResult.userId) {
    return error("You cannot delete your own account", 400, "SELF_DELETE");
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId, tenantId: authResult.tenantId },
    select: { id: true, email: true, role: true },
  });
  if (!existing) return error("User not found", 404, "NOT_FOUND");

  if (existing.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { tenantId: authResult.tenantId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return error("Cannot delete the only admin in the organization", 400, "LAST_ADMIN");
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  await createAuditLog({
    action: "DELETE_USER",
    entity: "User",
    entityId: userId,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { email: existing.email },
  });

  return success({ message: "User deleted successfully" });
}
