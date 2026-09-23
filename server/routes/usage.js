import express from "express";
import { protect } from "../middleware/auth.js";
import { getUserUsage } from "../services/usage.service.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getUserUsage(req.user._id) });
  } catch (err) {
    next(err);
  }
});

export default router;
