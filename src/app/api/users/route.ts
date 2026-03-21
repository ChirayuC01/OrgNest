import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helper/requireAuth";
import { hashPassword } from "@/lib/hash";

export async function POST(req: Request) {
    try {
        // Only ADMIN can create users
        const admin = await requireAuth(req, ["ADMIN"]);

        const body = await req.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password || !role) {
            return Response.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Prevent invalid roles
        if (!["MANAGER", "EMPLOYEE"].includes(role)) {
            return Response.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return Response.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user inside SAME tenant
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                tenantId: admin.tenantId, // CRITICAL
            },
        });

        return Response.json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error: any) {
        return Response.json(
            { error: error.message },
            { status: 403 }
        );
    }
}