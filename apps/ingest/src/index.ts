import { Elysia } from "elysia";
import "dotenv/config";
import { ingestData } from "./ingest";

const app = new Elysia()
  .get("/", () => "Ingest service is running")
  .post("/ingest", async ({ request }) => {
    if (request.headers.get("Authorization") !== process.env.INGEST_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    ingestData();
    return new Response("Data ingestion started", { status: 200 });
  })
  .listen(process.env.PORT || 3333);

export default app.fetch;

console.log(
  `Ingest service is running at http://${app.server?.hostname}:${app.server?.port}`
);
