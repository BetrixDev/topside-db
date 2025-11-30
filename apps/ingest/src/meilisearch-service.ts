import { Context, Data, Effect, Layer } from "effect";
import {
  MeiliSearch,
  MeiliSearchApiError,
  type Settings as IndexSettings,
  type RecordAny,
} from "meilisearch";

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_MASTER_KEY || "masterKey",
});

export class MeilisearchError extends Data.TaggedClass("MeilisearchError")<{
  cause: unknown;
}> {}

export class MeilisearchService extends Context.Tag("MeilisearchService")<
  MeilisearchService,
  {
    syncIndex: (
      indexName: string,
      documents: RecordAny[],
      indexSettings?: IndexSettings
    ) => Effect.Effect<void, MeilisearchError>;
  }
>() {}

export const MeilisearchServiceLive = Layer.succeed(MeilisearchService, {
  syncIndex: (
    indexName: string,
    documents: RecordAny[],
    indexSettings?: IndexSettings
  ) =>
    Effect.gen(function* () {
      const index = meilisearch.index(indexName);

      const oldSettings = yield* Effect.tryPromise({
        try: () => index.getSettings(),
        catch: (error) => new MeilisearchError({ cause: error }),
      }).pipe(
        Effect.catchAll((error) => {
          const cause = error.cause;
          if (
            cause instanceof MeiliSearchApiError &&
            cause.cause?.code === "index_not_found"
          ) {
            return Effect.succeed(undefined);
          }
          return Effect.fail(error);
        })
      );

      const oldDocuments = yield* Effect.tryPromise({
        try: () => index.getDocuments(),
        catch: (error) => new MeilisearchError({ cause: error }),
      }).pipe(
        Effect.catchAll((error) => {
          const cause = error.cause;
          if (
            cause instanceof MeiliSearchApiError &&
            cause.cause?.code === "index_not_found"
          ) {
            return Effect.succeed({ results: [] as RecordAny[] });
          }
          return Effect.fail(error);
        })
      );

      if (indexSettings) {
        yield* Effect.retry(
          Effect.tryPromise({
            try: () => index.updateSettings(indexSettings),
            catch: (error) => new MeilisearchError({ cause: error }),
          }),
          { times: 2 }
        );
      }

      if (oldDocuments.results.length > 0) {
        yield* Effect.retry(
          Effect.tryPromise({
            try: () => index.deleteAllDocuments(),
            catch: (error) => new MeilisearchError({ cause: error }),
          }),
          { times: 2 }
        );
      }

      yield* Effect.retry(
        Effect.tryPromise({
          try: () => index.addDocuments(documents, { primaryKey: "id" }),
          catch: (error) => new MeilisearchError({ cause: error }),
        }),
        { times: 2 }
      ).pipe(
        Effect.catchTag("MeilisearchError", () =>
          Effect.gen(function* () {
            // Only attempt rollback if we had previous data
            if (oldSettings) {
              yield* Effect.tryPromise({
                try: () => index.updateSettings(oldSettings),
                catch: (error) => new MeilisearchError({ cause: error }),
              });
            }

            if (oldDocuments.results.length > 0) {
              yield* Effect.tryPromise({
                try: () => index.addDocuments(oldDocuments.results),
                catch: (error) => new MeilisearchError({ cause: error }),
              });
            }

            return yield* Effect.fail(
              new MeilisearchError({
                cause: new Error("Failed to sync meilisearch index"),
              })
            );
          })
        )
      );
    }),
});
