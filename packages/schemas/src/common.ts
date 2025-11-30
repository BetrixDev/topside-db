import { z } from "zod";

// Schema for localized strings (name, description, etc.)
export const localizedStringSchema = z.record(z.string(), z.coerce.string());

export type LocalizedString = z.infer<typeof localizedStringSchema>;
