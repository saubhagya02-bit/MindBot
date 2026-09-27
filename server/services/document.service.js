import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";
import { extractText } from "./textExtractor.service.js";
import { chunkText } from "./chunk.service.js";
import { embedBatch } from "./embedding.service.js";
import logger from "../config/logger.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

export async function processUpload({ userId, file }) {
  const doc = await Document.create({
    userId,
    filename: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    status: "processing",
  });

  try {
    const text = await extractText(file.buffer, file.mimetype);
    if (!text?.trim()) {
      throw new AppError(
        "No extractable text found in this file.",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const chunks = chunkText(text);
    const embeddings = await embedBatch(chunks);

    await DocumentChunk.insertMany(
      chunks.map((content, i) => ({
        documentId: doc._id,
        userId,
        chunkIndex: i,
        content,
        embedding: embeddings[i],
      })),
    );

    doc.status = "ready";
    doc.chunkCount = chunks.length;
    await doc.save();
  } catch (err) {
    logger.error({ err, documentId: doc._id }, "Document processing failed");
    doc.status = "failed";
    doc.error = (err.message || "Processing failed").slice(0, 300);
    await doc.save();
    throw err;
  }

  return doc;
}

export async function listDocuments(userId) {
  return Document.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function deleteDocument(documentId, userId) {
  const doc = await Document.findOneAndDelete({ _id: documentId, userId });
  if (!doc) {
    throw new AppError("Document not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  await DocumentChunk.deleteMany({ documentId, userId });
  return doc;
}
