import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  provider: { type: String, required: true },
  model: { type: String, required: true },
  tier: { type: String, default: "fast" },
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: 0 }, // USD
  timestamp: { type: Date, default: Date.now },
});

aiUsageSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model("AIUsage", aiUsageSchema);
