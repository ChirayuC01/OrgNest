import { authMiddleware } from "@/server/middleware/auth";
import { checkPermission } from "@/server/middleware/authorize";
import type { PermissionModule, PermissionAction } from "@/lib/permissions";
import type { TokenPayload } from "@/lib/auth";

export async function requireAuth(req: Request): Promise<TokenPayload> {
    return authMiddleware(req);
}

export async function requirePermission(
    req: Request,
    module: PermissionModule,
    action: PermissionAction
): Promise<TokenPayload> {
    const user = await authMiddleware(req);
    await checkPermission(user, module, action);
    return user;
}

export async function requireRole(
    req: Request,
    roles: string[]
): Promise<TokenPayload> {
    const user = await authMiddleware(req);
    if (!roles.includes(user.role)) throw new Error("Forbidden");
    return user;
}
