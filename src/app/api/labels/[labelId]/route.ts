import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

const patchLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color e.g. #6366f1")
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: { labelId: string } }) {
  const authResult = await requirePermission("TASKS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const { labelId } = params;
  const existing = await prisma.label.findUnique({
    where: { id: labelId, tenantId: authResult.tenantId },
  });
  if (!existing) return error("Label not found", 404, "NOT_FOUND");

  const body = await req.json();
  const parsed = patchLabelSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const label = await prisma.label.update({
    where: { id: labelId },
    data: parsed.data,
  });

  return success(label);
}

export async function DELETE(_req: Request, { params }: { params: { labelId: string } }) {
  const authResult = await requirePermission("TASKS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const { labelId } = params;
  const existing = await prisma.label.findUnique({
    where: { id: labelId, tenantId: authResult.tenantId },
  });
  if (!existing) return error("Label not found", 404, "NOT_FOUND");

  await prisma.label.delete({ where: { id: labelId } });
  return success({ message: "Label deleted" });
}
