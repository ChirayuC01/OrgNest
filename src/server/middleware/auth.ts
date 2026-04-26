import { cookies } from "next/headers";
import { verifyToken } from "@/lib/verify";
import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth";

export async function authMiddleware(): Promise<JwtPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) throw new Error("Unauthorized");

  const decoded = verifyToken(token);
  if (!decoded) throw new Error("Invalid or expired token");

  // Check if user is banned (lightweight query — only fetches isBanned)
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { isBanned: true },
  });

  if (!user || user.isBanned) throw new Error("Account suspended");

  return decoded;
}
