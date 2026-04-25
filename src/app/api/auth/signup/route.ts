/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new organization and admin account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, organizationName]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, format: password }
 *               organizationName: { type: string, minLength: 1, maxLength: 255 }
 *     responses:
 *       201:
 *         description: Signup successful. Sets access_token and refresh_token cookies.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { error } from "@/helper/apiResponse";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .max(255),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
    }

    const { name, email, password, organizationName } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return error("An account with this email already exists", 409, "EMAIL_TAKEN");
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

    const payload = {
      userId: result.user.id,
      tenantId: result.user.tenantId,
      role: result.user.role as "ADMIN" | "MANAGER" | "EMPLOYEE",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const isProduction = process.env.NODE_ENV === "production";
    const securePart = isProduction ? "; Secure" : "";

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append(
      "Set-Cookie",
      `access_token=${accessToken}; HttpOnly${securePart}; SameSite=Strict; Path=/; Max-Age=900`
    );
    headers.append(
      "Set-Cookie",
      `refresh_token=${refreshToken}; HttpOnly${securePart}; SameSite=Strict; Path=/api/auth; Max-Age=604800`
    );

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
      { headers, status: 201 }
    );
  } catch {
    return error("Internal server error", 500, "SERVER_ERROR");
  }
}
