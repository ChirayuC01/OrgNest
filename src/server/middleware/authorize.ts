import { resolvePermission } from "@/lib/permissions";
import type { PermissionModule, PermissionAction } from "@/lib/permissions";
import type { TokenPayload } from "@/lib/auth";

export type { PermissionModule, PermissionAction };

export async function checkPermission(
    user: TokenPayload,
    module: PermissionModule,
    action: PermissionAction
): Promise<void> {
    const allowed = await resolvePermission(user.userId, user.role, module, action);
    if (!allowed) throw new Error("Forbidden");
}

// Legacy role-only check (kept for backward compatibility during migration)
export function authorize(allowedRoles: string[]) {
    return (user: { role: string }) => {
        if (!allowedRoles.includes(user.role)) {
            throw new Error("Forbidden");
        }
    };
}
