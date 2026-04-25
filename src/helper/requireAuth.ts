import { authMiddleware } from "@/server/middleware/auth";
import { authorize } from "@/server/middleware/authorize";
import { canAccess } from "@/lib/permissions";
import { error } from "@/helper/apiResponse";
import type { Role, AppModule, PermissionAction } from "@prisma/client";

export async function requireAuth(roles?: Role[]) {
  const user = await authMiddleware();

  if (roles && roles.length > 0) {
    authorize(roles)(user);
  }

  return user;
}

// Fine-grained permission check — consults UserPermission overrides then ROLE_DEFAULTS.
// Returns the authenticated user on success; returns an error Response on failure.
// Usage: const result = await requirePermission("TASKS", "WRITE");
//        if (result instanceof Response) return result;
export async function requirePermission(module: AppModule, action: PermissionAction) {
  const user = await authMiddleware();

  const allowed = await canAccess(user.userId, user.role as Role, module, action);
  if (!allowed) {
    return error("You do not have permission to perform this action", 403, "FORBIDDEN");
  }

  return user;
}
