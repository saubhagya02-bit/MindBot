import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

// pdf-parse 2.x exports a PDFParse class (1.x exported a function). Pin the
// major version in package.json so an upgrade can't silently change this.
async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    // pdf-parse 2.x appends page markers like "-- 1 of 3 --"; drop them
    return result.text.replace(/\n*-- \d+ of \d+ --\n*/g, "\n").trim();
  } catch (err) {
    throw new AppError(
      "Could not read this PDF. It may be corrupted or password-protected.",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export async function extractText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new AppError(
    `Unsupported file type: ${mimeType}`,
    400,
    ERROR_CODES.VALIDATION_ERROR,
  );
}
