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
  // Accept any non-empty string, trim whitespace
  message: z
    .string({ required_error: "Message is required" })
    .min(1, "Message cannot be empty")
    .max(10000, "Message too long")
    .trim(),

  sessionId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val.startsWith("temp-") ? undefined : val)),
});

export const sessionTitleSchema = z.object({
  title: z.string().min(1).max(100).trim(),
});
