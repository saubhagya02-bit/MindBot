import logger from "../config/logger.js";
import { ERROR_CODES } from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  const requestId = req.id || "unknown";

  // ALWAYS print the real error in the backend terminal
  console.error("\n========== CHAT/API ERROR ==========");
  console.error("Request:", req.method, req.originalUrl);
  console.error("Request ID:", requestId);
  console.error("Name:", err?.name);
  console.error("Message:", err?.message);
  console.error("Code:", err?.code);
  console.error("Status:", err?.statusCode);
  console.error("Stack:\n", err?.stack);
  console.error("====================================\n");

  logger.error(
    {
      requestId,
      name: err?.name,
      message: err?.message,
      code: err?.code,
      statusCode: err?.statusCode,
      path: req.path,
      method: req.method,
      stack: err?.stack,
    },
    "Unhandled request error",
  );

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");

    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message,
        requestId,
      },
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";

    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_EMAIL_TAKEN,
        message: `${field} already in use.`,
        requestId,
      },
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: "Invalid token.",
        requestId,
      },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_TOKEN_EXPIRED,
        message: "Token expired. Please log in again.",
        requestId,
      },
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: err?.message || "Internal server error",
      requestId,
    },
  });
};

export default errorHandler;
