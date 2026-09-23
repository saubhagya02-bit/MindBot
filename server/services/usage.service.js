import AIUsage from "../models/AIUsage.js";
import { PRICING } from "../config/ai.config.js";
import logger from "../config/logger.js";

const PER_MILLION = 1_000_000;

export function estimateCost(model, inputTokens, outputTokens) {
  const price = PRICING[model];
  if (!price) return 0;
  return (
    (inputTokens / PER_MILLION) * price.input +
    (outputTokens / PER_MILLION) * price.output
  );
}

export async function recordUsage({
  userId,
  provider,
  model,
  tier,
  usage,
  latencyMs,
}) {
  try {
    const inputTokens = usage?.inputTokens || 0;
    const outputTokens = usage?.outputTokens || 0;

    await AIUsage.create({
      userId,
      provider,
      model,
      tier,
      inputTokens,
      outputTokens,
      latencyMs,
      estimatedCost: estimateCost(model, inputTokens, outputTokens),
    });
  } catch (err) {
    logger.warn({ err, userId }, "Failed to record AI usage");
  }
}

const round = (n, digits) => Number((n || 0).toFixed(digits));

export async function getUserUsage(userId) {
  const [agg] = await AIUsage.aggregate([
    { $match: { userId } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              requests: { $sum: 1 },
              inputTokens: { $sum: "$inputTokens" },
              outputTokens: { $sum: "$outputTokens" },
              estimatedCost: { $sum: "$estimatedCost" },
              avgLatencyMs: { $avg: "$latencyMs" },
            },
          },
        ],
        byModel: [
          {
            $group: {
              _id: "$model",
              requests: { $sum: 1 },
              tokens: { $sum: { $add: ["$inputTokens", "$outputTokens"] } },
              estimatedCost: { $sum: "$estimatedCost" },
            },
          },
          { $sort: { requests: -1 } },
        ],
      },
    },
  ]);

  const totals = agg?.totals?.[0] || {};

  return {
    requests: totals.requests || 0,
    inputTokens: totals.inputTokens || 0,
    outputTokens: totals.outputTokens || 0,
    totalTokens: (totals.inputTokens || 0) + (totals.outputTokens || 0),
    estimatedCost: round(totals.estimatedCost, 6),
    avgLatencyMs: Math.round(totals.avgLatencyMs || 0),
    byModel: (agg?.byModel || []).map((m) => ({
      model: m._id,
      requests: m.requests,
      tokens: m.tokens,
      estimatedCost: round(m.estimatedCost, 6),
    })),
  };
}
