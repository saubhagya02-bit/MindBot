import logger from "../../config/logger.js";
import { AppError, ERROR_CODES } from "../../utils/AppError.js";
import { MODEL_TIERS, DEFAULT_TIER } from "../../config/ai.config.js";

const RETRYABLE_STATUSES = new Set([400, 403, 404, 429]);

export class AIProvider {
  constructor(id, label) {
    this.id = id;
    this.label = label;
  }

  isConfigured() {
    throw new Error(`${this.constructor.name} must implement isConfigured()`);
  }

  async openStream() {
    throw new Error(`${this.constructor.name} must implement openStream()`);
  }

  getModels(tier) {
    const tiers = MODEL_TIERS[this.id] || {};
    return tiers[tier] || tiers[DEFAULT_TIER] || [];
  }

  async stream(history, message, { tier = DEFAULT_TIER, context = "" } = {}) {
    if (!this.isConfigured()) {
      throw new AppError(
        `${this.label} is not configured on the server.`,
        500,
        ERROR_CODES.AI_KEY_MISSING,
      );
    }

    let lastError = null;

    for (const model of this.getModels(tier)) {
      try {
        logger.info({ provider: this.id, model }, "🤖 Trying model");
        const opened = await this.openStream(model, history, message, context);
        return { provider: this.id, model, ...opened };
      } catch (err) {
        lastError = err;
        const code = err.status || err.statusCode || 0;
        logger.warn(
          { provider: this.id, model, code, msg: err.message?.slice(0, 80) },
          "⚠️ Model failed — trying next",
        );
        if (RETRYABLE_STATUSES.has(code) || !code) continue;
        throw new AppError(err.message, 502, ERROR_CODES.AI_PROVIDER_ERROR);
      }
    }

    const code = lastError?.status || lastError?.statusCode;
    if (code === 429) {
      throw new AppError(
        "All AI models are rate-limited. Please wait and try again.",
        429,
        ERROR_CODES.AI_RATE_LIMITED,
      );
    }
    throw new AppError(
      "All AI models failed. Please try again later.",
      502,
      ERROR_CODES.AI_PROVIDER_ERROR,
    );
  }

  async complete(history, message, options) {
    const { provider, model, chunks, getUsage } = await this.stream(
      history,
      message,
      options,
    );

    try {
      let text = "";
      for await (const chunk of chunks) text += chunk;
      const usage = await getUsage();
      return { provider, model, text, usage };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        "The AI couldn't generate a response for that message.",
        502,
        ERROR_CODES.AI_PROVIDER_ERROR,
      );
    }
  }
}

export default AIProvider;
