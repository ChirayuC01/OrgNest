import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";
import { hashPassword } from "@/lib/hash";
import { createAuditLog } from "@/lib/audit";
import { success, error } from "@/helper/apiResponse";

export async function GET() {
  try {
    const user = await requireAuth();

    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return success(users);
  } catch {
    return error("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuth(["ADMIN"]);

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return error("All fields are required", 400, "VALIDATION_ERROR");
    }

    if (!["MANAGER", "EMPLOYEE"].includes(role)) {
      return error("Invalid role", 400, "VALIDATION_ERROR");
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
        tenantId: admin.tenantId,
      },
    });

    await createAuditLog({
      action: "CREATE_USER",
      entity: "User",
      entityId: user.id,
      userId: admin.userId,
      tenantId: admin.tenantId,
      metadata: { email: user.email, role: user.role },
    });

    return success(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Forbidden: Access denied" ? 403 : 500;
    return error(message, status);
  }
}
