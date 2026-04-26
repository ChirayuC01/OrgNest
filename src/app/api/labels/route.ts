import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { success, error } from "@/helper/apiResponse";

const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color e.g. #6366f1")
    .default("#6366f1"),
});

/**
 * GET /api/labels — list all labels for the tenant
 */
export async function GET() {
  const authResult = await requirePermission("TASKS", "READ");
  if (authResult instanceof Response) return authResult;

  const labels = await prisma.label.findMany({
    where: { tenantId: authResult.tenantId },
    orderBy: { name: "asc" },
  });

  return success(labels);
}

/**
 * POST /api/labels — create a label (managers/admins only)
 */
export async function POST(req: Request) {
  const authResult = await requirePermission("TASKS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const parsed = createLabelSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");

  const existing = await prisma.label.findUnique({
    where: { tenantId_name: { tenantId: authResult.tenantId, name: parsed.data.name } },
  });
  if (existing) return error("A label with that name already exists", 409, "CONFLICT");

  const label = await prisma.label.create({
    data: { ...parsed.data, tenantId: authResult.tenantId },
  });

  return success(label, 201);
}
