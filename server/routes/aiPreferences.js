import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../validators/chat.validator.js";
import { aiPreferencesSchema } from "../validators/ai.validator.js";
import { listProviders } from "../services/ai/AIRouter.js";
import { TIERS, DEFAULT_PROVIDER } from "../config/ai.config.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const router = express.Router();
router.use(protect);

const shape = (user) => ({
  tier: user.aiTier,
  provider: user.aiProvider,
  defaultProvider: DEFAULT_PROVIDER,
  tiers: TIERS,
  providers: listProviders(),
});

router.get("/preferences", (req, res) => {
  res.json({ success: true, data: shape(req.user) });
});

router.put(
  "/preferences",
  validate(aiPreferencesSchema),
  async (req, res, next) => {
    try {
      const { tier, provider } = req.body;

      if (provider && provider !== "default") {
        const found = listProviders().find((p) => p.id === provider);
        if (!found?.configured) {
          return next(
            new AppError(
              `${found?.label || provider} isn't configured on this server.`,
              400,
              ERROR_CODES.VALIDATION_ERROR,
            ),
          );
        }
      }

      const updates = {};
      if (tier) updates.aiTier = tier;
      if (provider) updates.aiProvider = provider;

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      res.json({ success: true, data: shape(user) });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
