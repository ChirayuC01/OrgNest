import { cookies } from "next/headers";
import { verifyToken } from "@/lib/verify";
import type { JwtPayload } from "@/lib/auth";

export async function authMiddleware(): Promise<JwtPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) throw new Error("Unauthorized");

  const decoded = verifyToken(token);
  if (!decoded) throw new Error("Invalid or expired token");

  return decoded;
}
