import { swaggerSpec } from "@/lib/swagger";

/**
 * Returns the OpenAPI 3.0 spec as JSON.
 * Consumed by the Swagger UI at /api-docs.
 */
export async function GET() {
  return Response.json(swaggerSpec);
}
