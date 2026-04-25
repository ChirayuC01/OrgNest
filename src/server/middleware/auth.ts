import { verifyToken } from "@/lib/verify";
import type { TokenPayload } from "@/lib/auth";

export async function authMiddleware(req: Request): Promise<TokenPayload> {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) throw new Error("Unauthorized");

    const token = cookieHeader
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

    if (!token) throw new Error("Unauthorized");

    const decoded = verifyToken(token);
    if (!decoded) throw new Error("Unauthorized");

    return decoded;
}
