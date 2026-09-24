import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import { chatLimiter, createRateLimiter } from "../middleware/rateLimiter.js";
import { validate, chatSchema } from "../validators/chat.validator.js";
import { generateReply } from "../services/ai/AIRouter.js";
import { resolveSession, appendMessages } from "../services/session.service.js";
import { recordUsage } from "../services/usage.service.js";
import { retrieveContext, buildContextBlock } from "../services/rag.service.js";
import {
  retrieveMemories,
  buildMemoryBlock,
  captureMemoriesAsync,
} from "../services/memory.service.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const router = express.Router();

const isProd = process.env.NODE_ENV === "production";

// Server-side guest cap (the client-side limit is only a UX hint)
const guestLimiter = createRateLimiter({
  windowSeconds: 24 * 60 * 60,
  max: isProd ? 3 : 50,
  keyFn: (req) => `rl:guest-chat:${req.ip}`,
  message: "Free trial limit reached. Please sign in to keep chatting.",
});

const limitByUserType = (req, res, next) =>
  req.user ? chatLimiter(req, res, next) : guestLimiter(req, res, next);

// POST /api/chat — open to guests (trial) and logged-in users
router.post(
  "/",
  optionalAuth,
  limitByUserType,
  validate(chatSchema),
  async (req, res, next) => {
    console.log(
      "chat request — has user:",
      Boolean(req.user),
      req.user?._id?.toString(),
    );
    try {
      const { message, sessionId } = req.body;
      const userId = req.user?._id;

      let session = null;
      let history = [];
      let context = "";

      if (userId) {
        session = await resolveSession(sessionId, userId, message);
        history = session.messages.map(({ role, content }) => ({
          role,
          content,
        }));

        const [chunks, memories] = await Promise.all([
          retrieveContext(userId, message),
          retrieveMemories(userId, message),
        ]);

        context = [buildContextBlock(chunks), buildMemoryBlock(memories)]
          .filter(Boolean)
          .join("\n\n");
      }

      const reply = await generateReply({
        history,
        message,
        provider: req.user?.aiProvider,
        tier: req.user?.aiTier,
        context,
      });

      if (!reply.text.trim()) {
        throw new AppError(
          "The AI returned an empty response.",
          502,
          ERROR_CODES.AI_NO_RESPONSE,
        );
      }

      if (session) {
        await appendMessages(session._id, userId, [
          { role: "user", content: message },
          { role: "assistant", content: reply.text },
        ]);

        await recordUsage({
          userId,
          provider: reply.provider,
          model: reply.model,
          tier: reply.tier,
          usage: reply.usage,
          latencyMs: reply.latencyMs,
        });

        captureMemoriesAsync(userId, message, reply.text);
      }

      res.json({
        success: true,
        data: {
          message: reply.text,
          sessionId: session ? session._id.toString() : null,
          title: session?.title,
          model: reply.model,
          provider: reply.provider,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
