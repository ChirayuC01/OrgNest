import { authMiddleware } from "@/server/middleware/auth";

export async function GET(req: Request) {
    try {
        const user = await authMiddleware(req);

        return Response.json(user);
    } catch {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
}