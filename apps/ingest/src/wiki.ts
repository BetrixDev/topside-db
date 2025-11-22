import { load } from "cheerio";
import z from "zod";
import { generateObject } from "ai";
import { openrouter } from "./ai";

export const BASE_WIKI_URL = "https://arcraiders.wiki";

const mapsPageSchema = z.object({
  maps: z
    .array(
      z.object({
        name: z.string(),
        wikiUrl: z.string(),
        imageUrl: z.string(),
        description: z.string().nullish(),
        maximumTimeMinutes: z.number(),
        requirements: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
            })
          )
          .describe("The requirements for the map. Empty if none."),
      })
    )
    .describe("The maps listed on the page in the first table"),
});

const mapPageSchema = z.object({
  mapImageUrl: z.string().describe("The URL of the map image on the page"),
  diffculties: z.array(
    z.object({
      id: z.string(),
      rating: z
        .number()
        .describe(
          "The rating of the difficulty in the form of a percentage of the fraction displayed on the page"
        ),
    })
  ),
});

export async function scrapeMapsPage() {
  console.log("Scraping maps page");
  const mapUrl = `${BASE_WIKI_URL}/wiki/Maps`;

  const response = await fetch(mapUrl);

  const html = await response.text();

  const $ = load(html);

  const content = $("#content").html();

  const { object } = await generateObject({
    model: openrouter("google/gemini-2.0-flash-001"),
    schema: mapsPageSchema,
    prompt: `Extract the maps from this webpage: ${content}`,
  });

  return object;
}

export async function scrapeMapPage(wikiUrl: string) {
  console.log(`Scraping map page: ${wikiUrl}`);
  const response = await fetch(`${BASE_WIKI_URL}${wikiUrl}`);

  const html = await response.text();

  const $ = load(html);

  const content = $("#content").html();

  const { object } = await generateObject({
    model: openrouter("google/gemini-2.0-flash-001"),
    schema: mapPageSchema,
    prompt: `Extract the map from this webpage: ${content}`,
  });

  return object;
}
