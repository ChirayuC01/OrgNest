"use client";

import { useAuthStore } from "@/store/authStore";
import type { PermissionModule, PermissionAction } from "@/lib/validation";

export function usePermissions() {
    const user = useAuthStore((s) => s.user);

    function can(module: PermissionModule, action: PermissionAction): boolean {
        return user?.permissions?.[module]?.[action] ?? false;
    }

    function isRole(...roles: string[]): boolean {
        return !!user && roles.includes(user.role);
    }

    return { can, isRole, user };
}
