import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query"] : [],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
