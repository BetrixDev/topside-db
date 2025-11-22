import { z } from "zod";

// Schema for localized strings (name, description, etc.)
export const localizedStringSchema = z.object({
  en: z.string(),
});

export type LocalizedString = z.infer<typeof localizedStringSchema>;
