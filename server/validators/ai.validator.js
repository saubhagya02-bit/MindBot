import { z } from "zod";
import { TIERS } from "../config/ai.config.js";

export const aiPreferencesSchema = z
  .object({
    tier: z.enum(TIERS).optional(),
    provider: z.enum(["default", "gemini", "openai"]).optional(),
  })
  .strict()
  .refine((v) => v.tier || v.provider, {
    message: "Provide a tier or a provider",
  });
