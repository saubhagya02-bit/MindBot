import OpenAI from "openai";
import AIProvider from "./AIProvider.js";
import { SYSTEM_PROMPT, GENERATION } from "../../config/ai.config.js";

export default class OpenAIProvider extends AIProvider {
  constructor() {
    super("openai", "OpenAI");
    this.client = null;
  }

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  getClient() {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this.client;
  }

  async openStream(model, history, message, context = "") {
    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\n${context}`
      : SYSTEM_PROMPT;

    const stream = await this.getClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      temperature: GENERATION.temperature,
      max_completion_tokens: GENERATION.maxOutputTokens,
      stream: true,
      stream_options: { include_usage: true },
    });

    let usage = { inputTokens: 0, outputTokens: 0 };

    async function* chunks() {
      for await (const part of stream) {
        const text = part.choices?.[0]?.delta?.content;
        if (text) yield text;
        if (part.usage) {
          usage = {
            inputTokens: part.usage.prompt_tokens || 0,
            outputTokens: part.usage.completion_tokens || 0,
          };
        }
      }
    }

    return { chunks: chunks(), getUsage: async () => usage };
  }
}
