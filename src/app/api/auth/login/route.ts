/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate and receive session cookies
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful. Sets access_token and refresh_token HttpOnly cookies.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid credentials
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { error } from "@/helper/apiResponse";
import { createAuditLog } from "@/lib/audit";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rl = rateLimit(`login:${ip}`, { limit: 10, windowSeconds: 15 * 60 });
    if (!rl.allowed) {
      return error(
        `Too many login attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutes.`,
        429,
        "RATE_LIMITED"
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400, "VALIDATION_ERROR");
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return error("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.isBanned) {
      return error(
        "Your account has been suspended. Please contact your administrator.",
        403,
        "ACCOUNT_BANNED"
      );
    }

    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as "ADMIN" | "MANAGER" | "EMPLOYEE",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const isProduction = env.NODE_ENV === "production";
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

    // Fire-and-forget audit — don't block the login response
    createAuditLog({
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      metadata: { email: user.email },
    });

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
      { headers, status: 200 }
    );
  } catch (err) {
    logger.error({ err }, "login error");
    return error("Internal server error", 500, "SERVER_ERROR");
  }
}
