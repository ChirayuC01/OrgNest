/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update the current user's profile (name and/or password)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2 }
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth";
import { hashPassword, comparePassword } from "@/lib/hash";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
  });

export async function PATCH(req: Request) {
  try {
    const auth = await authMiddleware();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

    const { name, currentPassword, newPassword } = parsed.data;

    if (!name && !newPassword) {
      return error("Nothing to update", 400, "NO_CHANGES");
    }

    // Fetch the user to verify current password if needed
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return error("User not found", 404, "NOT_FOUND");

    if (newPassword) {
      if (!currentPassword) {
        return error("Current password is required", 400, "VALIDATION_ERROR");
      }
      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) return error("Current password is incorrect", 400, "INVALID_PASSWORD");
    }

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(name && { name }),
        ...(newPassword && { password: await hashPassword(newPassword) }),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await createAuditLog({
      action: "UPDATE_PROFILE",
      entity: "User",
      entityId: auth.userId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      metadata: {
        updatedFields: [...(name ? ["name"] : []), ...(newPassword ? ["password"] : [])],
      },
    });

    return success(updated);
  } catch {
    return error("Internal server error", 500, "SERVER_ERROR");
  }
}
