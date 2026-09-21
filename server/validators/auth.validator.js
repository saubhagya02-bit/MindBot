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

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50).trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z
  .object({
    name: z.string().min(2).max(50).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    theme: z
      .enum(["dark", "darker", "light", "teal", "rose", "green"])
      .optional(),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color hex")
      .optional(),
  })
  .strict();

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
