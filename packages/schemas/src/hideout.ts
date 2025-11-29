import { z } from "zod";
import { localizedStringSchema } from "./common";

// Schema for hideout level requirement item
const hideoutStationLevelRequirementSchema = z.object({
  itemId: z.string(),
  quantity: z.number(),
});

// Schema for hideout level
const hideoutStationLevelSchema = z.object({
  level: z.number(),
  requirementItemIds: z.array(hideoutStationLevelRequirementSchema),
});

// Main hideout schema
export const hideoutStationSchema = z.object({
  id: z.string(),
  name: localizedStringSchema,
  maxLevel: z.number(),
  levels: z.array(hideoutStationLevelSchema),
});

export type HideoutStation = z.infer<typeof hideoutStationSchema>;
export type HideoutStationLevel = z.infer<typeof hideoutStationLevelSchema>;
export type HideoutStationLevelRequirement = z.infer<
  typeof hideoutStationLevelRequirementSchema
>;
