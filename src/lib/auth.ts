import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

const JWT_SECRET = env.JWT_SECRET;

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
