import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL"),

  JWT_SECRET: z
    .string()
    .min(1, "JWT_SECRET is required")
    .min(32, "JWT_SECRET must be at least 32 characters"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Use process.stderr directly — logger is not yet initialised at this point
    process.stderr.write(`\n❌ Invalid environment variables:\n${missing}\n\n`);
    process.exit(1);
  }
  return result.data;
}

// Validated env — import this everywhere instead of process.env.X
export const env = parseEnv();
