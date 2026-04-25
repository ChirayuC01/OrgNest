import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email:    z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
    name:             z.string().min(2, "Name must be at least 2 characters"),
    email:            z.string().email("Invalid email address"),
    password:         z.string().min(8, "Password must be at least 8 characters"),
    organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const taskStatusValues = ["pending", "in_progress", "done"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const;
export const taskSortByValues = ["createdAt", "dueDate", "priority", "title", "updatedAt"] as const;

export type TaskStatus   = typeof taskStatusValues[number];
export type TaskPriority = typeof taskPriorityValues[number];

export const createTaskSchema = z.object({
    title:        z.string().min(1, "Title is required").max(200, "Title is too long"),
    description:  z.string().max(2000).optional(),
    priority:     z.enum(taskPriorityValues).default("MEDIUM"),
    dueDate:      z.string().datetime({ offset: true }).optional(),
    assignedToId: z.string().cuid("Invalid user ID").optional(),
    status:       z.enum(taskStatusValues).default("pending"),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
    search:       z.string().optional(),
    status:       z.preprocess(
        (v) => (Array.isArray(v) ? v : v ? [v] : undefined),
        z.array(z.enum(taskStatusValues)).optional()
    ),
    priority:     z.preprocess(
        (v) => (Array.isArray(v) ? v : v ? [v] : undefined),
        z.array(z.enum(taskPriorityValues)).optional()
    ),
    assignedToId: z.string().cuid().optional(),
    overdue:      z.preprocess((v) => v === "true", z.boolean()).optional(),
    sortBy:       z.enum(taskSortByValues).default("createdAt"),
    order:        z.enum(["asc", "desc"]).default("desc"),
    cursor:       z.string().optional(),
    limit:        z.preprocess((v) => (v ? Number(v) : 20), z.number().min(1).max(50)).default(20),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const inviteUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    role:  z.enum(["MANAGER", "EMPLOYEE"], { message: "Role must be MANAGER or EMPLOYEE" }),
});

export const acceptInviteSchema = z.object({
    name:     z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Permissions ─────────────────────────────────────────────────────────────

export const permissionModuleValues = ["TASKS", "TEAM", "ANALYTICS", "AUDIT", "SETTINGS"] as const;
export const permissionActionValues = ["read", "write", "delete"] as const;

export type PermissionModule = typeof permissionModuleValues[number];
export type PermissionAction = typeof permissionActionValues[number];

export const updatePermissionSchema = z.object({
    module:  z.enum(permissionModuleValues),
    action:  z.enum(permissionActionValues),
    granted: z.boolean().nullable(),
});

// ─── Audit ───────────────────────────────────────────────────────────────────

export const auditQuerySchema = z.object({
    action:   z.string().optional(),
    userId:   z.string().cuid().optional(),
    cursor:   z.string().optional(),
    limit:    z.preprocess((v) => (v ? Number(v) : 25), z.number().min(1).max(100)).default(25),
});
