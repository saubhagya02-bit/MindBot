import Redis from "ioredis";
import logger from "./logger.js";

let redis = null;
let lastLogAt = 0;

// Log Redis connection problems at most once per minute
const logThrottled = (level, obj, msg) => {
  const now = Date.now();
  if (now - lastLogAt < 60_000) return;
  lastLogAt = now;
  logger[level](obj, msg);
};

export function getRedis() {
  if (!redis) {
    const uri = process.env.REDIS_URI || "redis://localhost:6379";
    redis = new Redis(uri, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5_000),
    });

    redis.on("connect", () => logger.info("✅ Redis connected"));
    redis.on("error", (err) =>
      logThrottled(
        "warn",
        { code: err.code },
        "⚠️ Redis unavailable — using memory fallback",
      ),
    );
  }
  return redis;
}

// Only talk to Redis when it is actually connected — otherwise fail fast
const isReady = () => getRedis().status === "ready";

// Helper: set with TTL (seconds)
export async function cacheSet(key, value, ttlSeconds = 60) {
  if (!isReady()) return;
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.debug({ err, key }, "Cache set failed — continuing without cache");
  }
}

// Helper: get cached value
export async function cacheGet(key) {
  if (!isReady()) return null;
  try {
    const val = await getRedis().get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    logger.debug({ err, key }, "Cache get failed — continuing without cache");
    return null;
  }
}

// Helper: delete cached key
export async function cacheDel(key) {
  if (!isReady()) return;
  try {
    await getRedis().del(key);
  } catch (err) {
    logger.debug({ err, key }, "Cache del failed");
  }
}

// Helper: increment rate limit counter (returns 0 if Redis is unavailable)
export async function rateIncr(key, windowSeconds) {
  if (!isReady()) return 0;
  try {
    const r = getRedis();
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, windowSeconds);
    return count;
  } catch {
    return 0;
  }
}

export default getRedis;
