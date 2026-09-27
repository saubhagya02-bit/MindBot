import { GoogleGenerativeAI } from "@google/generative-ai";
import { EMBEDDING_MODEL } from "../config/rag.config.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new AppError(
        "GEMINI_API_KEY is not configured.",
        500,
        ERROR_CODES.AI_KEY_MISSING,
      );
    }
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

export async function embedText(text) {
  const model = getClient().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

const CONCURRENCY = 5;
export async function embedBatch(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.all(batch.map(embedText))));
  }
  return results;
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
