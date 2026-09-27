import { GoogleGenerativeAI } from "@google/generative-ai";
import Memory from "../models/Memory.js";
import { embedText, cosineSimilarity } from "./embedding.service.js";
import { TOP_K, MIN_SIMILARITY } from "../config/rag.config.js";
import logger from "../config/logger.js";

const MAX_MEMORIES_PER_USER = 200;
const EXTRACTOR_MODEL = "gemini-2.5-flash-lite";

let client = null;
function getClient() {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

const EXTRACTION_PROMPT = `Extract durable facts about the user from this exchange that would be worth remembering in future conversations — preferences, ongoing projects, decisions, identity details. Ignore small talk, one-off details, and anything about the assistant rather than the user.

Respond with ONLY a JSON array of short standalone fact strings. If nothing is worth remembering, respond with [].

User message: {{USER}}
Assistant reply: {{ASSISTANT}}`;

export async function extractFacts(userMessage, assistantMessage) {
  try {
    const model = getClient().getGenerativeModel({ model: EXTRACTOR_MODEL });
    const prompt = EXTRACTION_PROMPT.replace(
      "{{USER}}",
      userMessage.slice(0, 2000),
    ).replace("{{ASSISTANT}}", assistantMessage.slice(0, 2000));

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .trim()
      .replace(/^```(?:json)?|```$/g, "")
      .trim();

    const facts = JSON.parse(text);
    return Array.isArray(facts)
      ? facts.filter((f) => typeof f === "string" && f.trim()).slice(0, 10)
      : [];
  } catch (err) {
    logger.debug({ err }, "Fact extraction failed — skipping");
    return [];
  }
}

export function captureMemoriesAsync(userId, userMessage, assistantMessage) {
  extractFacts(userMessage, assistantMessage)
    .then(async (facts) => {
      if (!facts.length) return;

      const embeddings = await Promise.all(facts.map(embedText));
      await Memory.insertMany(
        facts.map((fact, i) => ({ userId, fact, embedding: embeddings[i] })),
      );

      const count = await Memory.countDocuments({ userId });
      if (count > MAX_MEMORIES_PER_USER) {
        const excess = await Memory.find({ userId })
          .sort({ createdAt: 1 })
          .limit(count - MAX_MEMORIES_PER_USER)
          .select("_id");
        await Memory.deleteMany({ _id: { $in: excess.map((m) => m._id) } });
      }
    })
    .catch((err) => logger.debug({ err, userId }, "Memory capture failed"));
}

export async function retrieveMemories(userId, query, limit = 3) {
  try {
    const memories = await Memory.find({ userId })
      .select("fact embedding")
      .lean();
    if (!memories.length) return [];

    const queryEmbedding = await embedText(query);
    return memories
      .map((m) => ({
        fact: m.fact,
        score: cosineSimilarity(queryEmbedding, m.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((m) => m.score > MIN_SIMILARITY)
      .map((m) => m.fact);
  } catch (err) {
    logger.debug({ err, userId }, "Memory retrieval failed");
    return [];
  }
}

export function buildMemoryBlock(facts) {
  if (!facts.length) return "";
  return `Relevant context the user has shared in past conversations:\n${facts
    .map((f) => `- ${f}`)
    .join("\n")}`;
}

export async function listMemories(userId) {
  return Memory.find({ userId })
    .sort({ createdAt: -1 })
    .select("-embedding")
    .lean();
}

export async function deleteMemory(memoryId, userId) {
  const memory = await Memory.findOneAndDelete({ _id: memoryId, userId });
  return memory;
}
