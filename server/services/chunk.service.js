import { CHUNK_WORDS, CHUNK_OVERLAP_WORDS } from "../config/rag.config.js";

export function chunkText(
  text,
  size = CHUNK_WORDS,
  overlap = CHUNK_OVERLAP_WORDS,
) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + size, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}
