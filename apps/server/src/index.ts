import "dotenv/config";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { createContext } from "@topside-db/api/context";
import { appRouter } from "@topside-db/api/routers/index";
import { cors } from "@elysiajs/cors";
import Elysia from "elysia";
import { logger } from "@tqman/nice-logger";

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

new Elysia()
  .use(
    logger({
      withTimestamp: true,
    })
  )
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "OPTIONS"],
    })
  )
  .get("/", () => new Response("OK", { status: 200 }))
  .get("/health", () => new Response("OK", { status: 200 }))
  .all(
    "/*",
    async ({ request }) => {
      const context = await createContext({ request });

      const rpcResult = await rpcHandler.handle(request, {
        prefix: "/rpc",
        context: context,
      });

      if (rpcResult.matched) {
        return rpcResult.response;
      }

      const apiResult = await apiHandler.handle(request, {
        prefix: "/api-reference",
        context: context,
      });

      if (apiResult.matched) {
        return apiResult.response;
      }

      return new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    }
  )
  .listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
  });
