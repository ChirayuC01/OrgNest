import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = generateToken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        });

        // 🍪 Set HTTP-only cookie
        return new Response(
            JSON.stringify({
                message: "Login successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            }),
            {
                headers: {
                    "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800`,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (err) {
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}