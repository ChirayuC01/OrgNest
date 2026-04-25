import { prisma } from "@/lib/prisma";
import type { PermissionModule, PermissionAction } from "@/lib/validation";

export type { PermissionModule, PermissionAction };

// ─── Role permission defaults (single source of truth) ───────────────────────

export const ROLE_PERMISSIONS = {
    ADMIN: {
        TASKS:     { read: true,  write: true,  delete: true  },
        TEAM:      { read: true,  write: true,  delete: true  },
        ANALYTICS: { read: true,  write: false, delete: false },
        AUDIT:     { read: true,  write: false, delete: false },
        SETTINGS:  { read: true,  write: true,  delete: false },
    },
    MANAGER: {
        TASKS:     { read: true,  write: true,  delete: false },
        TEAM:      { read: true,  write: false, delete: false },
        ANALYTICS: { read: true,  write: false, delete: false },
        AUDIT:     { read: false, write: false, delete: false },
        SETTINGS:  { read: false, write: false, delete: false },
    },
    EMPLOYEE: {
        TASKS:     { read: true,  write: false, delete: false },
        TEAM:      { read: false, write: false, delete: false },
        ANALYTICS: { read: false, write: false, delete: false },
        AUDIT:     { read: false, write: false, delete: false },
        SETTINGS:  { read: false, write: false, delete: false },
    },
} as const satisfies Record<string, Record<PermissionModule, Record<PermissionAction, boolean>>>;

// ─── Resolve a single permission (DB override → role default) ────────────────

export async function resolvePermission(
    userId: string,
    role: string,
    module: PermissionModule,
    action: PermissionAction
): Promise<boolean> {
    const override = await prisma.userPermission.findUnique({
        where: { userId_module_action: { userId, module, action } },
        select: { granted: true },
    });

    if (override !== null) return override.granted;

    const roleDefaults = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    if (!roleDefaults) return false;

    return roleDefaults[module]?.[action] ?? false;
}

// ─── Resolve the full permission map for a user (for /api/auth/me) ───────────

export type FullPermissionMap = Record<
    PermissionModule,
    Record<PermissionAction, boolean> & { overrides: Partial<Record<PermissionAction, boolean>> }
>;

export async function resolveAllPermissions(
    userId: string,
    role: string
): Promise<FullPermissionMap> {
    const overrides = await prisma.userPermission.findMany({
        where: { userId },
        select: { module: true, action: true, granted: true },
    });

    const overrideMap: Partial<Record<PermissionModule, Partial<Record<PermissionAction, boolean>>>> = {};
    for (const o of overrides) {
        const mod = o.module as PermissionModule;
        const act = o.action as PermissionAction;
        overrideMap[mod] ??= {};
        overrideMap[mod]![act] = o.granted;
    }

    const roleDefaults = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? ROLE_PERMISSIONS.EMPLOYEE;
    const modules = Object.keys(roleDefaults) as PermissionModule[];

    const result = {} as FullPermissionMap;
    for (const mod of modules) {
        const actions = ["read", "write", "delete"] as PermissionAction[];
        const resolved = {} as Record<PermissionAction, boolean>;
        for (const act of actions) {
            resolved[act] = overrideMap[mod]?.[act] ?? roleDefaults[mod][act];
        }
        result[mod] = { ...resolved, overrides: overrideMap[mod] ?? {} };
    }

    return result;
}
