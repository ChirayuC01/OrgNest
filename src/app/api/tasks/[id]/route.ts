import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { createAuditLog } from "@/lib/audit";
import { success, error, validationError, formatZodError } from "@/helper/apiResponse";
import { updateTaskSchema } from "@/lib/validation";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const user    = await requirePermission(req, "TASKS", "write");
        const { id }  = await ctx.params;

        const existing = await prisma.task.findFirst({ where: { id, tenantId: user.tenantId } });
        if (!existing) return error("Task not found", 404);

        const body   = await req.json();
        const parsed = updateTaskSchema.safeParse(body);
        if (!parsed.success) return validationError(formatZodError(parsed.error));

        const { title, description, priority, dueDate, assignedToId, status } = parsed.data;

        if (assignedToId) {
            const assignee = await prisma.user.findFirst({ where: { id: assignedToId, tenantId: user.tenantId } });
            if (!assignee) return error("Assignee not found in your organization", 400);
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(title        !== undefined && { title }),
                ...(description  !== undefined && { description }),
                ...(priority     !== undefined && { priority }),
                ...(status       !== undefined && { status }),
                ...(dueDate      !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(assignedToId !== undefined && { assignedToId: assignedToId ?? null }),
            },
            include: { assignedUser: { select: { id: true, name: true, email: true } } },
        });

        await createAuditLog({
            action:   "UPDATE_TASK",
            entity:   "Task",
            entityId: task.id,
            userId:   user.userId,
            tenantId: user.tenantId,
            metadata: { changes: parsed.data },
        });

        return success(task);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Server error";
        return error(msg, msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    }
}

export async function DELETE(req: Request, ctx: Ctx) {
    try {
        const user   = await requirePermission(req, "TASKS", "delete");
        const { id } = await ctx.params;

        const existing = await prisma.task.findFirst({ where: { id, tenantId: user.tenantId } });
        if (!existing) return error("Task not found", 404);

        await prisma.task.delete({ where: { id } });

        await createAuditLog({
            action:   "DELETE_TASK",
            entity:   "Task",
            entityId: id,
            userId:   user.userId,
            tenantId: user.tenantId,
            metadata: { title: existing.title },
        });

        return success({ id });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Server error";
        return error(msg, msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500);
    }
}
