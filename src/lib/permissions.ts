import type { Role, AppModule, PermissionAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ─── Role-level defaults ───────────────────────────────────────────────────────
// What each role can do by default, before any per-user overrides are applied.
// MANAGE is a superset that implies READ + WRITE + DELETE.

export const ROLE_DEFAULTS: Record<Role, Partial<Record<AppModule, PermissionAction[]>>> = {
  ADMIN: {
    TASKS: ["READ", "WRITE", "DELETE", "MANAGE"],
    USERS: ["READ", "WRITE", "DELETE", "MANAGE"],
    AUDIT: ["READ"],
    ANALYTICS: ["READ"],
    SETTINGS: ["READ", "WRITE", "MANAGE"],
  },
  MANAGER: {
    TASKS: ["READ", "WRITE"],
    USERS: ["READ"],
    AUDIT: [],
    ANALYTICS: ["READ"],
    SETTINGS: [],
  },
  EMPLOYEE: {
    TASKS: ["READ"],
    USERS: [],
    AUDIT: [],
    ANALYTICS: [],
    SETTINGS: [],
  },
};

// ─── Permission resolution ─────────────────────────────────────────────────────
// Resolution order:
//   1. Check UserPermission row for (userId, module, action) — use granted field if found
//   2. Check for a MANAGE override (covers all actions under that module)
//   3. Fall back to ROLE_DEFAULTS[role][module]

export async function canAccess(
  userId: string,
  role: Role,
  module: AppModule,
  action: PermissionAction
): Promise<boolean> {
  // Exact action override
  const exactOverride = await prisma.userPermission.findUnique({
    where: { userId_module_action: { userId, module, action } },
  });
  if (exactOverride !== null) return exactOverride.granted;

  // MANAGE override (grants all sub-actions unless explicitly denied above)
  if (action !== "MANAGE") {
    const manageOverride = await prisma.userPermission.findUnique({
      where: { userId_module_action: { userId, module, action: "MANAGE" } },
    });
    if (manageOverride !== null) return manageOverride.granted;
  }

  // Role default
  const defaults = ROLE_DEFAULTS[role][module] ?? [];
  return defaults.includes(action) || defaults.includes("MANAGE");
}

// ─── Full permission map for a user ───────────────────────────────────────────
// Returns a flat map like { "TASKS.READ": true, "USERS.WRITE": false, ... }
// Used by the frontend to show/hide UI elements without per-action DB calls.

export async function resolveUserPermissions(
  userId: string,
  role: Role,
  tenantId: string
): Promise<Record<string, boolean>> {
  const overrides = await prisma.userPermission.findMany({
    where: { userId, tenantId },
  });

  const modules: AppModule[] = ["TASKS", "USERS", "AUDIT", "ANALYTICS", "SETTINGS"];
  const actions: PermissionAction[] = ["READ", "WRITE", "DELETE", "MANAGE"];

  const result: Record<string, boolean> = {};

  for (const mod of modules) {
    for (const action of actions) {
      const override = overrides.find((o) => o.module === mod && o.action === action);
      if (override) {
        result[`${mod}.${action}`] = override.granted;
      } else if (action !== "MANAGE") {
        // Check if a MANAGE override exists for this module
        const manageOverride = overrides.find((o) => o.module === mod && o.action === "MANAGE");
        if (manageOverride) {
          result[`${mod}.${action}`] = manageOverride.granted;
        } else {
          const defaults = ROLE_DEFAULTS[role][mod] ?? [];
          result[`${mod}.${action}`] = defaults.includes(action) || defaults.includes("MANAGE");
        }
      } else {
        const defaults = ROLE_DEFAULTS[role][mod] ?? [];
        result[`${mod}.${action}`] = defaults.includes("MANAGE");
      }
    }
  }

  return result;
}
