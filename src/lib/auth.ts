import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface TokenPayload {
    userId: string;
    tenantId: string;
    role: string;
}

export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
