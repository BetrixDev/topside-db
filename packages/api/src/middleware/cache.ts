import { os } from "@orpc/server";
import type { Context } from "../context";

export interface CacheOptions {
  /** in seconds */
  ttl?: number;
  keyPrefix?: string;
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttl = 60 * 60 * 24, keyPrefix = "cache" } = options;

  return os
    .$context<Context>()
    .middleware(async ({ next, context, path }, input, output) => {
      const cacheKey = `${keyPrefix}:${path.join("/")}:${JSON.stringify(
        input
      )}`;

      try {
        const cached = await context.redis.get(cacheKey);

        if (cached) {
          return output(JSON.parse(cached));
        }
      } catch (err) {
        console.error("Cache read error:", err);
      }

      const result = await next();

      context.redis
        .set(cacheKey, JSON.stringify(result.output), {
          EX: ttl,
        })
        .catch((err) => {
          console.error("Cache write error:", err);
        });

      return result;
    });
};
