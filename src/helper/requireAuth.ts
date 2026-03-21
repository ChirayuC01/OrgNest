import { authMiddleware } from "@/server/middleware/auth";
import { authorize } from "@/server/middleware/authorize";

export async function requireAuth(
    req: Request,
    roles?: string[]
) {
    // Authenticate user
    const user = await authMiddleware(req);

    // Check roles (if provided)
    if (roles && roles.length > 0) {
        authorize(roles)(user);
    }

    return user;
}