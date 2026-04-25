import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type AuditParams = {
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        tenantId: params.tenantId,
        // Prisma v7 nullable Json: use DbNull for explicit null, omit for undefined
        metadata:
          params.metadata !== undefined
            ? (params.metadata as Prisma.InputJsonValue)
            : Prisma.DbNull,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
