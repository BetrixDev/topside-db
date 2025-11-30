import { z } from "zod";

export const itemSearchHitSchema = z.object({
  kind: z.literal("items"),
  id: z.string(),
  name: z.string(),
  type: z.string(),
  imageFilename: z.string().nullish(),
});

export const questSearchHitSchema = z.object({
  kind: z.literal("quests"),
  id: z.string(),
  name: z.string(),
  trader: z.string(),
});

export const hideoutSearchHitSchema = z.object({
  kind: z.literal("hideoutStations"),
  id: z.string(),
  name: z.string(),
});

export const mapSearchHitSchema = z.object({
  kind: z.literal("maps"),
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  maximumTimeMinutes: z.number().nullish(),
  imageUrl: z.string().nullish(),
});

export const arcSearchHitSchema = z.object({
  kind: z.literal("arcs"),
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  threatLevel: z.string().nullish(),
  imageUrl: z.string().nullish(),
  health: z.number().nullish(),
});

export const traderSearchHitSchema = z.object({
  kind: z.literal("traders"),
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
});

export const searchHitSchema = z.discriminatedUnion("kind", [
  itemSearchHitSchema,
  questSearchHitSchema,
  hideoutSearchHitSchema,
  mapSearchHitSchema,
  arcSearchHitSchema,
  traderSearchHitSchema,
]);

export const searchCategorySchema = z.enum([
  "items",
  "quests",
  "hideoutStations",
  "maps",
  "arcs",
  "traders",
]);

export const searchInputSchema = z.object({
  query: z.string(),
  category: searchCategorySchema.optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

export type ItemSearchHit = z.infer<typeof itemSearchHitSchema>;
export type QuestSearchHit = z.infer<typeof questSearchHitSchema>;
export type HideoutSearchHit = z.infer<typeof hideoutSearchHitSchema>;
export type MapSearchHit = z.infer<typeof mapSearchHitSchema>;
export type ArcSearchHit = z.infer<typeof arcSearchHitSchema>;
export type TraderSearchHit = z.infer<typeof traderSearchHitSchema>;
export type SearchHit = z.infer<typeof searchHitSchema>;
export type SearchCategory = z.infer<typeof searchCategorySchema>;
export type SearchInput = z.infer<typeof searchInputSchema>;

export type SearchHitByCategory = {
  items: ItemSearchHit;
  quests: QuestSearchHit;
  hideoutStations: HideoutSearchHit;
  maps: MapSearchHit;
  arcs: ArcSearchHit;
  traders: TraderSearchHit;
};

export interface SearchResult<T extends SearchHit = SearchHit> {
  hits: T[];
  totalHits: number;
  processingTimeMs: number;
  limit: number;
  offset: number;
}
