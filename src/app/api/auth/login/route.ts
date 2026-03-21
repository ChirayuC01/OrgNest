import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return Response.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return Response.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Compare password
        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            return Response.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = generateToken({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
        });

        return Response.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}