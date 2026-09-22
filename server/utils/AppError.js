// Standard error codes used across the app
export const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_EMAIL_TAKEN: "AUTH_EMAIL_TAKEN",
  AUTH_PASSWORD_WRONG: "AUTH_PASSWORD_WRONG",

  // Session
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_ACCESS_DENIED: "SESSION_ACCESS_DENIED",

  // AI
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
  AI_NO_RESPONSE: "AI_NO_RESPONSE",
  AI_KEY_MISSING: "AI_KEY_MISSING",

  // Input
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // General
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

// Custom error class with code + statusCode
export class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // mark as known/expected error
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
