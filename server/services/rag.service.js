import mongoose from "mongoose";
import DocumentChunk from "../models/DocumentChunk.js";
import { embedText, cosineSimilarity } from "./embedding.service.js";
import { TOP_K, MIN_SIMILARITY } from "../config/rag.config.js";
import logger from "../config/logger.js";

const USE_ATLAS_VECTOR_SEARCH = process.env.USE_ATLAS_VECTOR_SEARCH === "true";
const VECTOR_INDEX_NAME =
  process.env.ATLAS_VECTOR_INDEX || "chunk_vector_index";

async function atlasVectorSearch(userId, queryEmbedding, limit) {
  return DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: limit * 20,
        limit,
        filter: { userId: new mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $project: {
        content: 1,
        documentId: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
}

async function inMemorySearch(userId, queryEmbedding, limit) {
  const chunks = await DocumentChunk.find({ userId })
    .select("content documentId embedding")
    .lean();

  return chunks
    .map((c) => ({
      ...c,
      score: cosineSimilarity(queryEmbedding, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ embedding, ...rest }) => rest);
}

export async function retrieveContext(userId, query, limit = TOP_K) {
  try {
    const queryEmbedding = await embedText(query);
    const results = USE_ATLAS_VECTOR_SEARCH
      ? await atlasVectorSearch(userId, queryEmbedding, limit)
      : await inMemorySearch(userId, queryEmbedding, limit);

    return results.filter((r) => r.score > MIN_SIMILARITY);
  } catch (err) {
    logger.warn(
      { err, userId },
      "RAG retrieval failed — continuing without document context",
    );
    return [];
  }
}

export function buildContextBlock(chunks) {
  if (!chunks.length) return "";
  const body = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
  return `Relevant excerpts from the user's uploaded documents:\n${body}\n\nUse them if they help answer the question; ignore them if they don't.`;
}
