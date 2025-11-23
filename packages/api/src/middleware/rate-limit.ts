import { ORPCError, os } from "@orpc/server";
import type { Context } from "../context";
import { createHash } from "crypto";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, keyPrefix = "ratelimit" } = options;

  return os.$context<Context>().middleware(async ({ next, context }) => {
    // Use IP or fingerprint for rate limiting
    const ip =
      context.headers["x-forwarded-for"] ||
      context.headers["x-real-ip"] ||
      "unknown";

    // Hash the IP for privacy
    const hashedIp = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const key = `${keyPrefix}:${hashedIp}`;

    try {
      const current = await context.redis.incr(key);

      if (current === 1) {
        // First request in window, set expiration
        await context.redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > maxRequests) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          status: 429,
          message: "Rate limit exceeded",
          data: {
            current,
            maxRequests,
            windowMs,
          },
        });
      }
    } catch (err) {
      console.error("Rate limit error:", err);
    }

    return next();
  });
};
