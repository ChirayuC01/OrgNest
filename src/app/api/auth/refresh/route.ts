/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh the access token using the refresh_token cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access_token cookie issued
 *       401:
 *         description: Invalid or expired refresh token
 */
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/verify";
import { generateAccessToken } from "@/lib/auth";
import { error } from "@/helper/apiResponse";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return error("No refresh token provided", 401, "UNAUTHORIZED");
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return error("Invalid or expired refresh token", 401, "INVALID_TOKEN");
    }

    const accessToken = generateAccessToken({
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const securePart = isProduction ? "; Secure" : "";

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append(
      "Set-Cookie",
      `access_token=${accessToken}; HttpOnly${securePart}; SameSite=Strict; Path=/; Max-Age=900`
    );

    return new Response(JSON.stringify({ success: true }), { headers, status: 200 });
  } catch {
    return error("Internal server error", 500, "SERVER_ERROR");
  }
}
