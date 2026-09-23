import logger from "../../config/logger.js";
import { AppError, ERROR_CODES } from "../../utils/AppError.js";
import {
  DEFAULT_PROVIDER,
  DEFAULT_TIER,
  TIERS,
} from "../../config/ai.config.js";
import GeminiProvider from "./GeminiProvider.js";
import OpenAIProvider from "./OpenAIProvider.js";

const providers = new Map(
  [new GeminiProvider(), new OpenAIProvider()].map((p) => [p.id, p]),
);

export function listProviders() {
  return [...providers.values()].map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(),
  }));
}

export function pickProvider(preferred) {
  const wanted =
    preferred && preferred !== "default" ? preferred : DEFAULT_PROVIDER;
  const provider = providers.get(wanted);
  if (provider?.isConfigured()) return provider;

  const fallback = [...providers.values()].find((p) => p.isConfigured());
  if (!fallback) {
    throw new AppError(
      "No AI provider is configured on the server.",
      500,
      ERROR_CODES.AI_KEY_MISSING,
    );
  }

  logger.warn(
    { wanted, using: fallback.id },
    "Provider unavailable — falling back",
  );
  return fallback;
}

export async function generateReply({
  history,
  message,
  provider,
  tier,
  context = "",
}) {
  const chosenTier = TIERS.includes(tier) ? tier : DEFAULT_TIER;
  const chosenProvider = pickProvider(provider);

  const startedAt = Date.now();
  const result = await chosenProvider.complete(history, message, {
    tier: chosenTier,
    context,
  });

  return { ...result, tier: chosenTier, latencyMs: Date.now() - startedAt };
}
