import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/helper/requireAuth";
import { hashPassword } from "@/lib/hash";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  const authResult = await requirePermission("USERS", "READ");
  if (authResult instanceof Response) return authResult;

  const users = await prisma.user.findMany({
    where: { tenantId: authResult.tenantId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return success(users);
}

export async function POST(req: Request) {
  const authResult = await requirePermission("USERS", "WRITE");
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return error("All fields are required", 400, "VALIDATION_ERROR");
  }

  if (!["MANAGER", "EMPLOYEE"].includes(role)) {
    return error("Invalid role. Must be MANAGER or EMPLOYEE", 400, "VALIDATION_ERROR");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return error("An account with this email already exists", 409, "EMAIL_TAKEN");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      tenantId: authResult.tenantId,
    },
  });

  await createAuditLog({
    action: "CREATE_USER",
    entity: "User",
    entityId: user.id,
    userId: authResult.userId,
    tenantId: authResult.tenantId,
    metadata: { email: user.email, role: user.role },
  });

  return success({ id: user.id, name: user.name, email: user.email, role: user.role }, 201);
}
