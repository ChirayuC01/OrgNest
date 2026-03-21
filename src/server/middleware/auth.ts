import { verifyToken } from "@/lib/verify";

export async function authMiddleware(req: Request) {
    const cookieHeader = req.headers.get("cookie");

    if (!cookieHeader) throw new Error("Unauthorized");

    const token = cookieHeader
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];

    if (!token) throw new Error("Unauthorized");

    const decoded = verifyToken(token);

    if (!decoded) throw new Error("Invalid token");

    return decoded as {
        userId: string;
        tenantId: string;
        role: string;
    };
}