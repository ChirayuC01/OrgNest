import { logger } from "@/lib/logger";
import { error as apiError } from "@/helper/apiResponse";

type RouteHandler = (
  req: Request,
  ctx?: { params: Record<string, string> }
) => Promise<Response>;

/**
 * Wraps a Next.js App Router route handler with:
 * - Request/response structured logging (method, path, status, duration)
 * - Unhandled error catch-all that returns a 500 and logs the full stack
 */
export function withLogging(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: { params: Record<string, string> }) => {
    const start = Date.now();
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      const res = await handler(req, ctx);
      const duration = Date.now() - start;

      logger.info({ method, path, status: res.status, duration }, "request");

      return res;
    } catch (err) {
      const duration = Date.now() - start;

      logger.error(
        {
          method,
          path,
          duration,
          err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        },
        "unhandled error"
      );

      return apiError("Internal server error", 500, "SERVER_ERROR");
    }
  };
}
