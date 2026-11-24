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
import Document from "../models/Document.js";
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
    try {
      const { message, sessionId, documentIds, editFromMessageId } = req.body;
      const userId = req.user?._id;

      // Only logged-in users get a persisted session, history, files and memory
      let session = null;
      let history = [];
      let context = "";
      let attachments = [];

      if (userId) {
        session = await resolveSession(sessionId, userId, message);

        // Editing: the conversation up to (not including) the edited message
        // is the history, and the edited message keeps its attached files.
        let baseMessages = session.messages;
        if (editFromMessageId) {
          const editIndex = session.messages.findIndex(
            (m) => String(m._id) === editFromMessageId.toLowerCase(),
          );
          const target = session.messages[editIndex];

          if (editIndex === -1 || target.role !== "user") {
            throw new AppError(
              "The message you tried to edit no longer exists. Refresh and try again.",
              404,
              ERROR_CODES.SESSION_NOT_FOUND,
            );
          }

          baseMessages = session.messages.slice(0, editIndex);
          attachments = (target.attachments || []).map((a) => ({
            documentId: a.documentId,
            filename: a.filename,
          }));
        }

        history = baseMessages.map(({ role, content }) => ({ role, content }));

        // New attachments: only accept files that belong to this user and
        // finished processing
        if (!editFromMessageId && documentIds?.length) {
          const docs = await Document.find({
            _id: { $in: documentIds },
            userId,
            status: "ready",
          })
            .select("filename")
            .lean();
          attachments = docs.map((d) => ({
            documentId: d._id,
            filename: d.filename,
          }));
        }

        // Files attached earlier in this conversation stay in scope
        const scopeIds = [
          ...new Set([
            ...session.documentIds.map(String),
            ...attachments.map((a) => String(a.documentId)),
          ]),
        ];

        // File + memory retrieval run in parallel; neither ever throws — both
        // fail soft to an empty result so a reply is never blocked by them.
        const [chunks, memories] = await Promise.all([
          retrieveContext(userId, message, { documentIds: scopeIds }),
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

      let messageIds;
      let messageCount;

      if (session) {
        // The old messages are only removed now, after a successful reply, so
        // a failed edit never destroys the conversation.
        const saved = await appendMessages(
          session._id,
          userId,
          [
            {
              role: "user",
              content: message,
              attachments,
              edited: Boolean(editFromMessageId),
            },
            { role: "assistant", content: reply.text },
          ],
          attachments.map((a) => a.documentId),
          { truncateFromMessageId: editFromMessageId },
        );

        const count = saved.messages.length;
        messageIds = {
          user: String(saved.messages[count - 2]._id),
          assistant: String(saved.messages[count - 1]._id),
        };
        messageCount = saved.messageCount;

        await recordUsage({
          userId,
          provider: reply.provider,
          model: reply.model,
          tier: reply.tier,
          usage: reply.usage,
          latencyMs: reply.latencyMs,
        });

        // Fire-and-forget: never awaited, never blocks the response
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
          messageIds,
          messageCount,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
