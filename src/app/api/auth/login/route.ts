import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { generateToken } from "@/lib/auth";
import { success, error } from "@/helper/apiResponse";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return error("Email and password are required", 400);
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return error("Invalid credentials", 401);
        }

        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            return error("Invalid credentials", 401);
        }

        const token = generateToken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
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
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
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
    } catch {
        return error("Server error", 500);
    }
}
