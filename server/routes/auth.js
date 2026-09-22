import express from "express";
import User from "../models/User.js";
import { protect, generateToken, sendTokenCookie } from "../middleware/auth.js";
import {
  validate,
  registerSchema,
  loginSchema,
  profileSchema,
  passwordSchema,
} from "../validators/auth.validator.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const exists = await User.findOne({ email });
      if (exists)
        return next(
          new AppError(
            "Email already in use.",
            400,
            ERROR_CODES.AUTH_EMAIL_TAKEN,
          ),
        );

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);
      sendTokenCookie(res, token);
      res.status(201).json({ success: true, user: user.toSafeObject(), token });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return next(
          new AppError(
            "Invalid email or password.",
            401,
            ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          ),
        );
      }
      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });
      const token = generateToken(user._id);
      sendTokenCookie(res, token);
      res.json({ success: true, user: user.toSafeObject(), token });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", protect, async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put(
  "/profile",
  protect,
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const { name, email, theme, accentColor } = req.body;
      const user = await User.findById(req.user._id);
      if (email && email !== user.email) {
        const taken = await User.findOne({ email });
        if (taken)
          return next(
            new AppError(
              "Email already in use.",
              400,
              ERROR_CODES.AUTH_EMAIL_TAKEN,
            ),
          );
        user.email = email;
      }
      if (name) user.name = name;
      if (theme) user.theme = theme;
      if (accentColor) user.accentColor = accentColor;
      await user.save();
      res.json({ success: true, user: user.toSafeObject() });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/auth/password
router.put(
  "/password",
  protect,
  validate(passwordSchema),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select("+password");
      if (!(await user.comparePassword(currentPassword))) {
        return next(
          new AppError(
            "Current password is incorrect.",
            401,
            ERROR_CODES.AUTH_PASSWORD_WRONG,
          ),
        );
      }
      user.password = newPassword;
      await user.save();
      res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
