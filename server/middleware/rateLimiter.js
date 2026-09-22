import { rateIncr } from "../config/redis.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const isProd = process.env.NODE_ENV === "production";

// Redis-backed rate limiter — falls back to in-memory if Redis is down
const memoryStore = new Map();

async function getCount(key, windowSeconds) {
  const count = await rateIncr(key, windowSeconds);
  if (count > 0) return count;

  const now = Date.now();
  const entry = memoryStore.get(key) || {
    count: 0,
    resetAt: now + windowSeconds * 1000,
  };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowSeconds * 1000;
  }
  entry.count++;
  memoryStore.set(key, entry);
  return entry.count;
}

export function createRateLimiter({
  windowSeconds = 60,
  max = 60,
  keyFn,
  message,
  code = ERROR_CODES.AI_RATE_LIMITED,
}) {
  return async (req, res, next) => {
    try {
      const key = keyFn ? keyFn(req) : `rl:ip:${req.ip}:${windowSeconds}`;
      const count = await getCount(key, windowSeconds);

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
      res.setHeader(
        "X-RateLimit-Reset",
        Math.floor(Date.now() / 1000) + windowSeconds,
      );

      if (count > max) {
        return next(
          new AppError(
            message ||
              `Too many requests. Limit: ${max} per ${windowSeconds}s.`,
            429,
            code,
          ),
        );
      }
      next();
    } catch {
      next();
    }
  };
}

// Pre-built limiters
export const globalLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 100,
  message: "Too many requests. Please slow down.",
});

export const authLimiter = createRateLimiter({
  windowSeconds: 900, // 15 min
  max: isProd ? 10 : 100,
  keyFn: (req) => `rl:auth:${req.ip}`,
  message: "Too many login attempts. Please try again in 15 minutes.",
  code: ERROR_CODES.AUTH_RATE_LIMITED,
});

export const chatLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 30,
  keyFn: (req) => `rl:chat:${req.user?._id || req.ip}`,
  message: "Too many messages. Please wait a moment.",
});
