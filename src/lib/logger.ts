import pino from "pino";
import { env } from "@/lib/env";

const isDev = env.NODE_ENV === "development";

export const logger = pino(
  {
    level: isDev ? "debug" : "info",
    // Redact sensitive fields wherever they appear in log objects
    redact: {
      paths: ["password", "token", "cookie", "authorization", "*.password", "*.token"],
      censor: "[REDACTED]",
    },
    // Add a timestamp in ISO-8601 format
    timestamp: pino.stdTimeFunctions.isoTime,
    // Human-readable base fields
    base: { env: env.NODE_ENV },
  },
  isDev
    ? // Pretty-print in development (pino-pretty writes to stdout)
      pino.transport({
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname,env" },
      })
    : // Structured JSON in production (stdout → log aggregator)
      process.stdout
);
