/**
 * POST /api/users/:userId/ban   — ban a user
 * DELETE /api/users/:userId/ban — unban a user
 *
 * Hierarchy rules:
 *   ADMIN   → can ban MANAGER or EMPLOYEE
 *   MANAGER → can ban EMPLOYEE only
 *   EMPLOYEE → cannot ban anyone
 */
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

async function resolveTarget(userId: string, tenantId: string) {
  return prisma.user.findUnique({
    where: { id: userId, tenantId },
    select: { id: true, name: true, email: true, role: true, isBanned: true },
  });
}

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const authResult = await requirePermission("USERS", "WRITE");
  if (authResult instanceof Response) return authResult;

  if (authResult.role === "EMPLOYEE") {
    return error("Employees cannot ban users", 403, "FORBIDDEN");
  }

  const { userId } = params;

  if (userId === authResult.userId) {
    return error("You cannot ban yourself", 400, "INVALID_REQUEST");
  }

  const target = await resolveTarget(userId, authResult.tenantId);
  if (!target) return error("User not found", 404, "NOT_FOUND");

  if (target.isBanned) return error("User is already banned", 400, "ALREADY_BANNED");

  // MANAGER can only ban EMPLOYEE
  if (authResult.role === "MANAGER" && target.role !== "EMPLOYEE") {
    return error("Managers can only ban employees", 403, "FORBIDDEN");
  }

  // Cannot ban ADMIN regardless of caller role (unless caller is also ADMIN)
  if (target.role === "ADMIN" && authResult.role !== "ADMIN") {
    return error("Cannot ban an admin", 403, "FORBIDDEN");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      bannedAt: new Date(),
      bannedById: authResult.userId,
    },
    select: { id: true, name: true, email: true, role: true, isBanned: true, bannedAt: true },
  });

  await createAuditLog({
    action: "BAN_USER",
    entity: "User",
    entityId: userId,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { name: target.name, email: target.email },
  });

  return success(updated);
}

export async function DELETE(_req: Request, { params }: { params: { userId: string } }) {
  const authResult = await requirePermission("USERS", "WRITE");
  if (authResult instanceof Response) return authResult;

  if (authResult.role === "EMPLOYEE") {
    return error("Employees cannot unban users", 403, "FORBIDDEN");
  }

  const { userId } = params;
  const target = await resolveTarget(userId, authResult.tenantId);
  if (!target) return error("User not found", 404, "NOT_FOUND");

  if (!target.isBanned) return error("User is not banned", 400, "NOT_BANNED");

  // Same hierarchy check for unban
  if (authResult.role === "MANAGER" && target.role !== "EMPLOYEE") {
    return error("Managers can only unban employees", 403, "FORBIDDEN");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, bannedAt: null, bannedById: null },
    select: { id: true, name: true, email: true, role: true, isBanned: true },
  });

  await createAuditLog({
    action: "UNBAN_USER",
    entity: "User",
    entityId: userId,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { name: target.name, email: target.email },
  });

  return success(updated);
}
