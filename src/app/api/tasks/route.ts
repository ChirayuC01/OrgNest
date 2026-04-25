import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error, validationError, formatZodError } from "@/helper/apiResponse";
import { taskQuerySchema, createTaskSchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const user = await requirePermission(req, "TASKS", "read");

        const { searchParams } = new URL(req.url);
        const raw = Object.fromEntries(searchParams.entries());
        // Collect multi-value params
        const statusArr   = searchParams.getAll("status");
        const priorityArr = searchParams.getAll("priority");
        if (statusArr.length)   raw.status   = statusArr as unknown as string;
        if (priorityArr.length) raw.priority = priorityArr as unknown as string;

        const parsed = taskQuerySchema.safeParse(raw);
        if (!parsed.success) return validationError(formatZodError(parsed.error));

        const { search, status, priority, assignedToId, overdue, sortBy, order, cursor, limit } = parsed.data;

        const where: Prisma.TaskWhereInput = {
            tenantId: user.tenantId,
            ...(search && {
                OR: [
                    { title:       { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(status?.length   && { status:   { in: status   as Prisma.EnumTaskStatusFilter["in"] } }),
            ...(priority?.length && { priority: { in: priority as Prisma.EnumPriorityFilter["in"]  } }),
            ...(assignedToId     && { assignedToId }),
            ...(overdue          && { dueDate: { lt: new Date() }, status: { not: "done" } }),
        };

        const orderByMap: Record<string, Prisma.TaskOrderByWithRelationInput> = {
            createdAt: { createdAt: order },
            updatedAt: { updatedAt: order },
            dueDate:   { dueDate:   order },
            title:     { title:     order },
            priority:  { priority:  order },
        };

        const tasks = await prisma.task.findMany({
            where,
            take:    limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            orderBy: orderByMap[sortBy] ?? { createdAt: "desc" },
            include: {
                assignedUser: { select: { id: true, name: true, email: true } },
            },
        });

        const hasMore   = tasks.length > limit;
        const items     = hasMore ? tasks.slice(0, limit) : tasks;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        const totalCount = await prisma.task.count({ where });

        return success({ tasks: items, nextCursor, totalCount });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Server error";
        return error(msg, msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    }
}

export async function POST(req: Request) {
    try {
        const user = await requirePermission(req, "TASKS", "write");

        const body   = await req.json();
        const parsed = createTaskSchema.safeParse(body);
        if (!parsed.success) return validationError(formatZodError(parsed.error));

        const { title, description, priority, dueDate, assignedToId, status } = parsed.data;

        // If assignedToId provided, verify they belong to the same tenant
        if (assignedToId) {
            const assignee = await prisma.user.findFirst({ where: { id: assignedToId, tenantId: user.tenantId } });
            if (!assignee) return error("Assignee not found in your organization", 400);
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                status,
                dueDate:      dueDate ? new Date(dueDate) : undefined,
                assignedToId: assignedToId ?? undefined,
                tenantId:     user.tenantId,
            },
            include: { assignedUser: { select: { id: true, name: true, email: true } } },
        });

        await createAuditLog({
            action:   "CREATE_TASK",
            entity:   "Task",
            entityId: task.id,
            userId:   user.userId,
            tenantId: user.tenantId,
            metadata: { title, priority, status },
        });

        return success(task, 201);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Server error";
        return error(msg, msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    }
}
