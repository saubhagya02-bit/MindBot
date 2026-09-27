import { createRequire } from "module";
import mammoth from "mammoth";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export async function extractText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
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
