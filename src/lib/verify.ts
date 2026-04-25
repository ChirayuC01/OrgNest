import jwt from "jsonwebtoken";
import type { TokenPayload } from "@/lib/auth";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}
