import { authMiddleware } from "@/server/middleware/auth";
import { resolveUserPermissions } from "@/lib/permissions";
import { success, error } from "@/helper/apiResponse";
import type { Role } from "@prisma/client";

// GET /api/permissions/me
// Returns the calling user's fully-resolved permission map.
// Used by the frontend to show/hide UI elements.
export async function GET() {
  try {
    const user = await authMiddleware();

    const permissions = await resolveUserPermissions(
      user.userId,
      user.role as Role,
      user.tenantId
    );

    return success(permissions);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}
