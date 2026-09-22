import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import { chatLimiter, createRateLimiter } from "../middleware/rateLimiter.js";
import { validate, chatSchema } from "../validators/chat.validator.js";
import { streamWithFallback, buildHistory } from "../services/ai.service.js";
import { resolveSession, appendMessages } from "../services/session.service.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const router = express.Router();

const isProd = process.env.NODE_ENV === "production";

const guestLimiter = createRateLimiter({
  windowSeconds: 24 * 60 * 60,
  max: isProd ? 3 : 50,
  keyFn: (req) => `rl:guest-chat:${req.ip}`,
  message: "Free trial limit reached. Please sign in to keep chatting.",
});

const limitByUserType = (req, res, next) =>
  req.user ? chatLimiter(req, res, next) : guestLimiter(req, res, next);

router.post(
  "/",
  optionalAuth,
  limitByUserType,
  validate(chatSchema),
  async (req, res, next) => {
    try {
      const { message, sessionId } = req.body;
      const userId = req.user?._id;

      let session = null;
      let history = [];
      if (userId) {
        session = await resolveSession(sessionId, userId, message);
        history = buildHistory(session.messages);
      }

      const { result, modelName } = await streamWithFallback(history, message);

      let aiText;
      try {
        aiText = (await result.response).text();
      } catch {
        throw new AppError(
          "The AI couldn't generate a response for that message.",
          502,
          ERROR_CODES.AI_PROVIDER_ERROR,
        );
      }

      if (!aiText?.trim()) {
        throw new AppError(
          "The AI returned an empty response.",
          502,
          ERROR_CODES.AI_NO_RESPONSE,
        );
      }

      if (session) {
        await appendMessages(session._id, userId, [
          { role: "user", content: message },
          { role: "assistant", content: aiText },
        ]);
      }

      res.json({
        success: true,
        data: {
          message: aiText,
          sessionId: session ? session._id.toString() : null,
          title: session?.title,
          model: modelName,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
