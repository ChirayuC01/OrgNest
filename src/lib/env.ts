import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET:   z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    NODE_ENV:     z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const missing = parsed.error.errors.map((e) => `  ${e.path.join(".")}: ${e.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${missing}`);
}

export const env = parsed.data;
