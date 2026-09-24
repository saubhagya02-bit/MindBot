import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import { getRedis } from "./config/redis.js";
import logger from "./config/logger.js";
import requestId from "./middleware/requestId.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";
import { AppError, ERROR_CODES } from "./utils/AppError.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import chatRoutes from "./routes/chat.js";
import usageRoutes from "./routes/usage.js";
import aiPreferencesRoutes from "./routes/aiPreferences.js";
import documentRoutes from "./routes/documents.js";
import memoryRoutes from "./routes/memory.js";
import swaggerSpec from "./config/swagger.js";

// Bootstrap
await connectDB();

try {
  await getRedis().connect();
} catch {
  logger.warn("Redis unavailable — using memory fallback");
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(requestId);

app.use("/api", globalLimiter);

// API Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes — ALL of these must be registered before the 404 handler below,
// or Express will never reach them.
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/ai", aiPreferencesRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/memory", memoryRoutes);

// Health Check
app.get("/api/health", async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;

  let redisOk = false;

  try {
    await getRedis().ping();
    redisOk = true;
  } catch {
    redisOk = false;
  }

  const status = mongoOk ? "ok" : "degraded";

  res.status(mongoOk ? 200 : 503).json({
    status,
    mongodb: mongoOk ? "✅ connected" : "❌ disconnected",
    redis: redisOk ? "✅ connected" : "⚠️ unavailable",
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: process.version,
    apiKey: process.env.GEMINI_API_KEY ? "✅ set" : "❌ missing",
  });
});

// 404 Handler — must stay LAST, after every real route above
app.use((req, res, next) => {
  next(
    new AppError(
      `Route ${req.method} ${req.path} not found.`,
      404,
      ERROR_CODES.NOT_FOUND,
    ),
  );
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info({ port: PORT }, "🚀 MindBot server started");
  logger.info({ url: `http://localhost:${PORT}/api/docs` }, "📚 API docs");
  logger.info(
    { url: `http://localhost:${PORT}/api/health` },
    "❤️ Health check",
  );
});

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info({ signal }, "Shutting down...");

  try {
    getRedis().disconnect();
  } catch {}

  try {
    await mongoose.connection.close();
  } catch {}

  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled rejection");
  process.exit(1);
});
