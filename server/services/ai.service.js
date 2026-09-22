import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import logger from "../config/logger.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const generationConfig = { temperature: 0.9, topP: 1, maxOutputTokens: 2048 };

export const SYSTEM_PROMPT = `You are Gemini AI, a helpful, creative, and intelligent assistant.
When writing code, use proper markdown code blocks with language identifiers.
Be concise but thorough. Use markdown formatting when it helps clarity.`;

export const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash-001",
  "gemini-2.5-flash-lite",
];

// Try each model in order — skip on quota/not-found errors
export async function streamWithFallback(history, message) {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError(
      "GEMINI_API_KEY is not configured.",
      500,
      ERROR_CODES.AI_KEY_MISSING,
    );
  }

  let lastError = null;

  for (const modelName of MODELS) {
    try {
      logger.info({ modelName }, "🤖 Trying model");
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig,
        systemInstruction: SYSTEM_PROMPT,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(message);
      logger.info({ modelName }, "✅ Model success");
      return { result, modelName };
    } catch (err) {
      lastError = err;
      const code = err.status || err.statusCode || 0;
      logger.warn(
        { modelName, code, msg: err.message?.slice(0, 80) },
        "⚠️ Model failed — trying next",
      );
      if (code === 429 || code === 404 || code === 400 || code === 403 || !code)
        continue;
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

// Build Gemini-format history from DB messages
export function buildHistory(messages) {
  return messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
}
