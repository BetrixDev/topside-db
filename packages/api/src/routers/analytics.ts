import { z } from "zod";
import { publicProcedure } from "../index";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { createHash } from "crypto";
import { Tables, eq, and, sql } from "@topside-db/db";
import type { Context } from "../context";
import { cacheMiddleware } from "../middleware/cache";

const resourceTypes = ["item", "quest", "hideout", "map", "arc"] as const;

// Rate limit: 30 views per minute per IP
const trackViewProcedure = publicProcedure.use(
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: "analytics:view",
  })
);

export const analyticsRouter = {
  trackView: trackViewProcedure
    .input(
      z.object({
        resourceType: z.enum(resourceTypes),
        resourceId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const { resourceType, resourceId } = input;

      // Create a session/visitor identifier
      const ip =
        context.headers["x-forwarded-for"] ||
        context.headers["x-real-ip"] ||
        "unknown";
      const userAgent = context.headers["user-agent"] || "unknown";
      const sessionId = createHash("sha256")
        .update(`${ip}-${userAgent}`)
        .digest("hex")
        .slice(0, 16);

      const viewKey = `pageview:${resourceType}:${resourceId}`;
      const uniqueKey = `pageview:unique:${resourceType}:${resourceId}:${sessionId}`;
      const lockKey = `pageview:lock:${resourceType}:${resourceId}`;

      try {
        // Check if this session already viewed this resource (within 6h)
        const isUnique = await context.redis.set(uniqueKey, "1", {
          EX: 60 * 60 * 6, // 6 hours
          NX: true, // Only set if doesn't exist
        });

        // Increment view counter in Redis
        await context.redis.hIncrBy(viewKey, "count", 1);
        if (isUnique) {
          await context.redis.hIncrBy(viewKey, "unique", 1);
        }

        // Set expiration for the view counter (flush every 5 minutes)
        await context.redis.expire(viewKey, 60 * 5);

        // Try to acquire lock for database flush (prevent concurrent flushes)
        const hasLock = await context.redis.set(lockKey, "1", {
          EX: 10, // Lock expires in 10 seconds
          NX: true,
        });

        // Flush to database if we have the lock and there are pending views
        if (hasLock) {
          await flushViewsToDatabase(context, resourceType, resourceId);
        }

        return { success: true };
      } catch (err) {
        console.error("Track view error:", err);
        return { success: false, error: String(err) };
      }
    }),

  // Get view count for a resource
  getViewCount: publicProcedure
    .input(
      z.object({
        resourceType: z.enum(resourceTypes),
        resourceId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const { resourceType, resourceId } = input;

      try {
        const result = await context.db
          .select()
          .from(Tables.pageViews)
          .where(
            and(
              eq(Tables.pageViews.resourceType, resourceType),
              eq(Tables.pageViews.resourceId, resourceId)
            )
          )
          .limit(1);

        const dbViews = result[0];

        // Also check Redis for pending views
        const viewKey = `pageview:${resourceType}:${resourceId}`;
        const pendingViews = await context.redis.hGetAll(viewKey);

        const totalViews =
          (dbViews?.viewCount || 0) + parseInt(pendingViews?.count || "0");
        const totalUnique =
          (dbViews?.uniqueViews || 0) + parseInt(pendingViews?.unique || "0");

        return {
          viewCount: totalViews,
          uniqueViews: totalUnique,
          lastUpdated: dbViews?.lastUpdated,
        };
      } catch (err) {
        console.error("Get view count error:", err);
        return {
          viewCount: 0,
          uniqueViews: 0,
          lastUpdated: null,
        };
      }
    }),

  getHighestViewedResources: publicProcedure
    .use(cacheMiddleware({ ttl: 60 * 5 }))
    .handler(async ({ context }) => {
      return context.db.query.pageViews.findMany({
        limit: 10,
        orderBy: (table, { desc }) => [desc(table.viewCount)],
        columns: {
          resourceType: true,
          resourceId: true,
          viewCount: true,
        },
      });
    }),

  getDisplayDataForResource: publicProcedure
    .use(cacheMiddleware())
    .input(
      z.object({
        resourceType: z.enum(resourceTypes),
        resourceId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const { resourceType, resourceId } = input;

      if (resourceType === "item") {
        const item = await context.db.query.items.findFirst({
          where: eq(Tables.items.id, resourceId),
          columns: {
            id: true,
            name: true,
            imageFilename: true,
          },
        });

        if (!item) {
          return null;
        }

        return {
          id: item.id,
          name: item.name,
          imageUrl: item.imageFilename,
        };
      }

      if (resourceType === "quest") {
        const quest = await context.db.query.quests.findFirst({
          where: eq(Tables.quests.id, resourceId),
          columns: {
            id: true,
            name: true,
          },
        });

        if (!quest) {
          return null;
        }

        return {
          id: quest.id,
          name: quest.name,
          imageUrl: null,
        };
      }

      if (resourceType === "hideout") {
        const hideout = await context.db.query.hideouts.findFirst({
          where: eq(Tables.hideouts.id, resourceId),
          columns: {
            id: true,
            name: true,
          },
        });

        if (!hideout) {
          return null;
        }

        return {
          id: hideout.id,
          name: hideout.name,
          imageUrl: null,
        };
      }

      if (resourceType === "map") {
        const map = await context.db.query.maps.findFirst({
          where: eq(Tables.maps.id, resourceId),
          columns: {
            id: true,
            name: true,
            imageUrl: true,
          },
        });

        if (!map) {
          return null;
        }

        return {
          id: map.id,
          name: map.name,
          imageUrl: map.imageUrl,
        };
      }

      if (resourceType === "arc") {
        const arc = await context.db.query.arcs.findFirst({
          where: eq(Tables.arcs.id, resourceId),
          columns: {
            id: true,
            name: true,
            imageUrl: true,
          },
        });

        if (!arc) {
          return null;
        }

        return {
          id: arc.id,
          name: arc.name,
          imageUrl: arc.imageUrl,
        };
      }

      if (resourceType === "trader") {
        const trader = await context.db.query.traders.findFirst({
          where: eq(Tables.traders.id, resourceId),
          columns: {
            id: true,
            name: true,
            imageUrl: true,
          },
        });

        if (!trader) {
          return null;
        }

        return {
          id: trader.id,
          name: trader.name,
          imageUrl: trader.imageUrl,
        };
      }

      return null;
    }),
};

// Helper function to flush Redis views to database
async function flushViewsToDatabase(
  context: Context,
  resourceType: string,
  resourceId: string
) {
  const viewKey = `pageview:${resourceType}:${resourceId}`;

  try {
    const views = await context.redis.hGetAll(viewKey);
    if (!views || !views.count) return;

    const count = parseInt(views.count);
    const unique = parseInt(views.unique || "0");

    if (count === 0) return;

    const id = `${resourceType}:${resourceId}`;

    // Upsert to database
    await context.db
      .insert(Tables.pageViews)
      .values({
        id,
        resourceType,
        resourceId,
        viewCount: count,
        uniqueViews: unique,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: Tables.pageViews.id,
        set: {
          viewCount: sql`${Tables.pageViews.viewCount} + ${count}`,
          uniqueViews: sql`${Tables.pageViews.uniqueViews} + ${unique}`,
          lastUpdated: new Date(),
        },
      });

    // Clear Redis counter after successful flush
    await context.redis.del(viewKey);
  } catch (err) {
    console.error("Flush views error:", err);
  }
}
