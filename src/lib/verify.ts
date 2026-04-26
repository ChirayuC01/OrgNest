import jwt from "jsonwebtoken";
import type { JwtPayload } from "@/lib/auth";
import { env } from "@/lib/env";

const JWT_SECRET = env.JWT_SECRET;

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
