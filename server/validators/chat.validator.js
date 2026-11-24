import { z } from "zod";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      let message = "Validation failed";
      try {
        const errors = result.error?.errors || result.error?.issues || [];
        if (Array.isArray(errors) && errors.length > 0) {
          message = errors
            .map((e) => `${e.path?.join(".") || "field"}: ${e.message}`)
            .join(", ");
        } else if (result.error?.message) {
          message = result.error.message;
        }
      } catch {
        message = "Invalid request data";
      }
      return next(new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR));
    }
    req.body = result.data;
    next();
  } catch (err) {
    next(new AppError("Validation error", 400, ERROR_CODES.VALIDATION_ERROR));
  }
};

export const chatSchema = z.object({
  // trim first so a whitespace-only message fails the min(1) check
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(10000, "Message too long"),

  sessionId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val.startsWith("temp-") ? undefined : val)),

  // Files attached to this message (uploaded beforehand via /api/documents/upload)
  documentIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid document id"))
    .max(5, "You can attach up to 5 files")
    .optional(),

  // Set when the user edits an earlier message: that message and everything
  // after it is replaced by this new message and the reply to it.
  editFromMessageId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid message id")
    .optional(),
});

export const sessionTitleSchema = z.object({
  title: z.string().min(1).max(100).trim(),
});
