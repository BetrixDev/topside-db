import { Context, Data, Effect, Layer } from "effect";
import { HttpClient, HttpClientError } from "@effect/platform";
import { load } from "cheerio";

export const BASE_WIKI_URL = "https://arcraiders.wiki";

export function getFullWikiUrl(urlOrPath: string): string {
  return urlOrPath.startsWith("http")
    ? urlOrPath
    : `${BASE_WIKI_URL}${urlOrPath}`;
}

export class WikiContentNotFoundError extends Data.TaggedClass(
  "WikiContentNotFoundError"
)<{
  url: string;
}> {}

export class WikiService extends Context.Tag("WikiService")<
  WikiService,
  {
    /**
     * Fetches a wiki page and returns the HTML content inside #content
     * @param urlOrPath - Full URL or path (e.g., "/wiki/Maps" or "https://arcraiders.wiki/wiki/Maps")
     */
    getPageContent: (
      urlOrPath: string
    ) => Effect.Effect<
      string,
      WikiContentNotFoundError | HttpClientError.HttpClientError
    >;
  }
>() {}

export const WikiServiceLive = Layer.effect(
  WikiService,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const cache = new Map<string, string>();

    return {
      getPageContent: (urlOrPath: string) =>
        Effect.gen(function* () {
          const fullUrl = getFullWikiUrl(urlOrPath);

          const cached = cache.get(fullUrl);
          if (cached) {
            yield* Effect.log(`Cache hit for: ${fullUrl}`);
            return cached;
          }

          yield* Effect.log(`Fetching wiki page: ${fullUrl}`);

          const response = yield* Effect.retry(client.get(fullUrl), {
            times: 2,
          });

          const html = yield* response.text;

          const $ = load(html);

          const content = $("#content").html();

          if (!content) {
            yield* Effect.log(`Wiki content not found for URL: ${fullUrl}`);
            return yield* Effect.fail(
              new WikiContentNotFoundError({ url: fullUrl })
            );
          }

          cache.set(fullUrl, content);

          return content;
        }),
    };
  })
);
