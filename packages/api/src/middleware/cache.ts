import { os } from "@orpc/server";
import type { Context } from "../context";

const DEFAULT_TTL = 60 * 60 * 24;

export const cacheMiddleware = os
  .$context<Context>()
  .middleware(async ({ next, context, path }, input, output) => {
    const cacheKey = `cache:${path.join("/")}:${JSON.stringify(input)}`;

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
        EX: DEFAULT_TTL,
      })
      .catch((err) => {
        console.error("Cache write error:", err);
      });

    return result;
  });
