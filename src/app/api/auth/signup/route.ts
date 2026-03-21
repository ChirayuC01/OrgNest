import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, organizationName } = body;

        // Basic validation
        if (!name || !email || !password || !organizationName) {
            return Response.json(
                { error: "All fields are required" },
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

        // Create Tenant + Admin User (transaction)
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: organizationName,
                },
            });

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

        // Generate JWT
        const token = generateToken({
            userId: result.user.id,
            tenantId: result.user.tenantId,
            role: result.user.role,
        });

        return Response.json({
            message: "Signup successful",
            token,
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
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