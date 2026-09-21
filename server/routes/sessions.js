import express from "express";
import { protect } from "../middleware/auth.js";
import { validate, sessionTitleSchema } from "../validators/chat.validator.js";
import {
  getUserSessions,
  getSessionById,
  createSession,
  deleteSession,
} from "../services/session.service.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    res.json(await getUserSessions(req.user._id));
  } catch (e) {
    next(e);
  }
});
router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createSession(req.user._id));
  } catch (e) {
    next(e);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    res.json(await getSessionById(req.params.id, req.user._id));
  } catch (e) {
    next(e);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    await deleteSession(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/:id/title",
  validate(sessionTitleSchema),
  async (req, res, next) => {
    try {
      const Session = (await import("../models/Session.js")).default;
      const s = await Session.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { title: req.body.title },
        { new: true },
      );
      if (!s)
        return next(
          new (await import("../utils/AppError.js")).AppError(
            "Session not found.",
            404,
          ),
        );
      res.json({ success: true, title: s.title });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
