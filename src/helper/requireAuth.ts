import { authMiddleware } from "@/server/middleware/auth";
import { authorize } from "@/server/middleware/authorize";
import type { Role } from "@prisma/client";

export async function requireAuth(roles?: Role[]) {
  const user = await authMiddleware();

  if (roles && roles.length > 0) {
    authorize(roles)(user);
  }

  return user;
}
