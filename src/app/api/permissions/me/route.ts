/**
 * @swagger
 * /api/permissions/me:
 *   get:
 *     summary: Get the current user's fully-resolved permission map
 *     tags: [Permissions]
 *     description: Returns a flat map of all module.action combinations resolved from role defaults and per-user overrides.
 *     responses:
 *       200:
 *         description: Permission map
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   example: { "TASKS.READ": true, "USERS.WRITE": false }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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
