import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function generateToken(payload: any) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
}