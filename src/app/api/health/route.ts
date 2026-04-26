import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check — verifies the API and database are reachable
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: healthy }
 *                 version: { type: string }
 *                 environment: { type: string }
 *                 dbLatencyMs: { type: number }
 *                 timestamp: { type: string, format: date-time }
 *       503:
 *         description: Service is unhealthy
 */
export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "healthy",
      version: process.env.npm_package_version ?? "0.1.0",
      environment: env.NODE_ENV,
      dbLatencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: "unhealthy",
        error: "Database unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
