import jwt from "jsonwebtoken";
import type { JwtPayload } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
