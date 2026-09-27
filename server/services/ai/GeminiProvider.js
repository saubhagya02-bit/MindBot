import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import AIProvider from "./AIProvider.js";
import { SYSTEM_PROMPT, GENERATION } from "../../config/ai.config.js";

const SAFETY_SETTINGS = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({
  category,
  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}));

const toGeminiHistory = (history) =>
  history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

export default class GeminiProvider extends AIProvider {
  constructor() {
    super("gemini", "Google Gemini");
    this.client = null;
  }

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  getClient() {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return this.client;
  }

  async openStream(model, history, message, context = "") {
    const systemInstruction = context
      ? `${SYSTEM_PROMPT}\n\n${context}`
      : SYSTEM_PROMPT;

    const chat = this.getClient()
      .getGenerativeModel({
        model,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: GENERATION,
        systemInstruction,
      })
      .startChat({ history: toGeminiHistory(history) });

    const result = await chat.sendMessageStream(message);

    async function* chunks() {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
    }

    const getUsage = async () => {
      const meta = (await result.response).usageMetadata || {};
      return {
        inputTokens: meta.promptTokenCount || 0,
        outputTokens:
          (meta.candidatesTokenCount || 0) + (meta.thoughtsTokenCount || 0),
      };
    };

    return { chunks: chunks(), getUsage };
  }
}
