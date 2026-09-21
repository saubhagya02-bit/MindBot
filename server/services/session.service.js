import Session from "../models/Session.js";
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";
import logger from "../config/logger.js";

const SESSION_LIST_TTL = 30; // seconds

// Get all sessions for a user (Redis cached)
export async function getUserSessions(userId) {
  const cacheKey = `sessions:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logger.info({ userId }, "Sessions served from cache");
    return cached;
  }

  const sessions = await Session.find({ userId })
    .select("title messageCount createdAt updatedAt model")
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  const result = sessions.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    messageCount: s.messageCount,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    model: s.model,
  }));

  await cacheSet(cacheKey, result, SESSION_LIST_TTL);
  return result;
}

// Get single session
export async function getSessionById(sessionId, userId) {
  const session = await Session.findOne({ _id: sessionId, userId }).lean();
  if (!session) {
    throw new AppError(
      "Session not found.",
      404,
      ERROR_CODES.SESSION_NOT_FOUND,
    );
  }
  return {
    id: session._id.toString(),
    title: session.title,
    messages: session.messages.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      edited: m.edited,
      timestamp: m.timestamp,
    })),
    messageCount: session.messageCount,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// Create a new session
export async function createSession(userId, title = "New conversation") {
  const session = await Session.create({ userId, title, messages: [] });
  await cacheDel(`sessions:${userId}`);
  return { id: session._id.toString(), title: session.title };
}

// Delete a session — enforce ownership
export async function deleteSession(sessionId, userId) {
  const session = await Session.findOneAndDelete({ _id: sessionId, userId });
  if (!session) {
    throw new AppError(
      "Session not found.",
      404,
      ERROR_CODES.SESSION_NOT_FOUND,
    );
  }
  await cacheDel(`sessions:${userId}`);
  return true;
}

// Add messages to a session and save
export async function appendMessages(sessionId, userId, messages) {
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError(
      "Session not found.",
      404,
      ERROR_CODES.SESSION_NOT_FOUND,
    );
  }
  session.messages.push(...messages);
  await session.save();
  await cacheDel(`sessions:${userId}`);
  return session;
}

// Create or find session for a chat request
export async function resolveSession(sessionId, userId, firstMessage) {
  if (sessionId) {
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session)
      throw new AppError(
        "Session not found.",
        404,
        ERROR_CODES.SESSION_NOT_FOUND,
      );
    return session;
  }
  // Create new session with auto-title from first message
  const title =
    firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
  const session = await Session.create({ userId, title, messages: [] });
  await cacheDel(`sessions:${userId}`);
  return session;
}