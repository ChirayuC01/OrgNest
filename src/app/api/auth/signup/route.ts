import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { generateToken } from "@/lib/auth";
import { success, error } from "@/helper/apiResponse";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, organizationName } = body;

        if (!name || !email || !password || !organizationName) {
            return error("All fields are required", 400);
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return error("An account with this email already exists", 400);
        }

        const hashedPassword = await hashPassword(password);

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({ data: { name: organizationName } });
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "ADMIN",
                    tenantId: tenant.id,
                },
            });
            return { user, tenant };
        });

        const token = generateToken({
            userId: result.user.id,
            tenantId: result.user.tenantId,
            role: result.user.role,
        });

        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = [
            `token=${token}`,
            "HttpOnly",
            "Path=/",
            "Max-Age=604800",
            "SameSite=Lax",
            ...(isProduction ? ["Secure"] : []),
        ].join("; ");

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                        role: result.user.role,
                    },
                },
            }),
            {
                headers: {
                    "Set-Cookie": cookieOptions,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (err) {
        console.error("[signup]", err);
        return error("Internal server error", 500);
    }
}
