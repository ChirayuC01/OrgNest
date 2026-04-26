/**
 * Simple in-memory rate limiter.
 * Uses a sliding-window counter keyed by identifier (e.g. IP or userId).
 *
 * NOTE: This is per-process only. For multi-instance deployments use
 * Redis. For a single Next.js serverless deployment (Vercel) this is
 * fine because each function instance handles its own traffic.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart > 15 * 60 * 1000) {
          store.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

export function rateLimit(identifier: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;

  const entry = store.get(identifier);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: opts.limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const resetAt = entry.windowStart + windowMs;
  const remaining = Math.max(0, opts.limit - entry.count);
  const allowed = entry.count <= opts.limit;

  return { allowed, remaining, resetAt };
}
