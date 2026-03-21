import { prisma } from "@/lib/prisma";

type AuditParams = {
    action: string;
    entity: string;
    entityId?: string;
    userId: string;
    tenantId: string;
    metadata?: any;
};

export async function createAuditLog(params: AuditParams) {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                userId: params.userId,
                tenantId: params.tenantId,
                metadata: params.metadata,
            },
        });
    } catch (err) {
        console.error("Audit log failed:", err);
    }
}