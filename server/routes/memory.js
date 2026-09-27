import express from "express";
import { protect } from "../middleware/auth.js";
import { listMemories, deleteMemory } from "../services/memory.service.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const router = express.Router();
router.use(protect);

// GET /api/memory — list what the assistant has remembered about the user
router.get("/", async (req, res, next) => {
  try {
    res.json({ success: true, data: await listMemories(req.user._id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/memory/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteMemory(req.params.id, req.user._id);
    if (!deleted) {
      throw new AppError("Memory not found.", 404, ERROR_CODES.NOT_FOUND);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
