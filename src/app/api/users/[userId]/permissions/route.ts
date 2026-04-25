/**
 * @swagger
 * /api/users/{userId}/permissions:
 *   get:
 *     summary: Get resolved permissions for a specific user (ADMIN only)
 *     tags: [Permissions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resolved permission map and raw overrides
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Set a per-user permission override (ADMIN only)
 *     tags: [Permissions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPermissionOverride'
 *     responses:
 *       200:
 *         description: Permission override saved
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     summary: Remove a per-user permission override, restoring role default (ADMIN only)
 *     tags: [Permissions]
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
 *             type: object
 *             required: [module, action]
 *             properties:
 *               module: { type: string, enum: [TASKS, USERS, AUDIT, ANALYTICS, SETTINGS] }
 *               action: { type: string, enum: [READ, WRITE, DELETE, MANAGE] }
 *     responses:
 *       200:
 *         description: Override removed
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { resolveUserPermissions } from "@/lib/permissions";
import { success, error } from "@/helper/apiResponse";
import type { Role } from "@prisma/client";

const upsertSchema = z.object({
  module: z.enum(["TASKS", "USERS", "AUDIT", "ANALYTICS", "SETTINGS"]),
  action: z.enum(["READ", "WRITE", "DELETE", "MANAGE"]),
  granted: z.boolean(),
});

// GET /api/users/:userId/permissions
// Returns the fully-resolved permission map for a specific user (ADMIN only)
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authResult = await requirePermission("USERS", "MANAGE");
  if (authResult instanceof Response) return authResult;

  const { userId } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId, tenantId: authResult.tenantId },
    select: { id: true, role: true, tenantId: true },
  });

  if (!targetUser) return error("User not found", 404, "NOT_FOUND");

  const permissions = await resolveUserPermissions(
    targetUser.id,
    targetUser.role as Role,
    targetUser.tenantId
  );

  // Also return the raw overrides so the UI can distinguish role defaults from user overrides
  const overrides = await prisma.userPermission.findMany({
    where: { userId, tenantId: authResult.tenantId },
    select: { module: true, action: true, granted: true },
  });

  return success({ resolved: permissions, overrides });
}

// PUT /api/users/:userId/permissions
// Upserts a per-user module permission override (ADMIN only)
export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authResult = await requirePermission("USERS", "MANAGE");
  if (authResult instanceof Response) return authResult;

  const { userId } = await params;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const { module, action, granted } = parsed.data;

  // Verify target user exists in the same tenant
  const targetUser = await prisma.user.findUnique({
    where: { id: userId, tenantId: authResult.tenantId },
    select: { id: true },
  });
  if (!targetUser) return error("User not found", 404, "NOT_FOUND");

  // Prevent admins from revoking their own USERS.MANAGE (would lock them out)
  if (
    userId === authResult.userId &&
    module === "USERS" &&
    (action === "MANAGE" || action === "DELETE") &&
    !granted
  ) {
    return error("Cannot revoke your own admin access", 400, "SELF_LOCKOUT");
  }

  const permission = await prisma.userPermission.upsert({
    where: { userId_module_action: { userId, module, action } },
    update: { granted, tenantId: authResult.tenantId },
    create: { userId, module, action, granted, tenantId: authResult.tenantId },
  });

  return success(permission);
}

// DELETE /api/users/:userId/permissions
// Removes a specific override, restoring the role default (ADMIN only)
export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authResult = await requirePermission("USERS", "MANAGE");
  if (authResult instanceof Response) return authResult;

  const { userId } = await params;

  const body = await req.json();
  const parsed = upsertSchema.omit({ granted: true }).safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const { module, action } = parsed.data;

  const existing = await prisma.userPermission.findUnique({
    where: { userId_module_action: { userId, module, action } },
  });

  if (!existing || existing.tenantId !== authResult.tenantId) {
    return error("Permission override not found", 404, "NOT_FOUND");
  }

  await prisma.userPermission.delete({
    where: { userId_module_action: { userId, module, action } },
  });

  return success({ message: "Override removed — role default now applies" });
}
