import express from "express";
import Session from "../models/Session.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// List user's sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .select("title messageCount createdAt updatedAt model")
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json(
      sessions.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        messageCount: s.messageCount,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        model: s.model,
      })),
    );
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({ error: "Could not fetch sessions." });
  }
});

// Get single session with messages
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) return res.status(404).json({ error: "Session not found." });

    res.json({
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
    });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({ error: "Could not fetch session." });
  }
});

// Create new session
router.post("/", async (req, res) => {
  try {
    const session = await Session.create({
      userId: req.user._id,
      title: "New conversation",
      messages: [],
    });

    res.status(201).json({
      id: session._id.toString(),
      title: session.title,
      messageCount: 0,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Could not create session." });
  }
});

// Delete session
router.delete("/:id", async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "Could not delete session." });
  }
});

// Update session title
router.patch("/:id/title", async (req, res) => {
  try {
    const { title } = req.body;
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title },
      { new: true },
    );
    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({ success: true, title: session.title });
  } catch (err) {
    res.status(500).json({ error: "Could not update title." });
  }
});

export default router;
