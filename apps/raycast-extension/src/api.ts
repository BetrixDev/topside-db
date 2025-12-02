import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "@topside-db/api/routers/index";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

export const api: AppRouterClient = createORPCClient(
  new RPCLink({
    url: "https://api.topside-db.com/rpc",
  })
);

export const orpc = createTanstackQueryUtils(api);
