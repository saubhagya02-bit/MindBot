import express from "express";
import User from "../models/User.js";
import { generateToken, sendTokenCookie, protect } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      success: true,
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "Email already in use." });
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ error: msg });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.json({
      success: true,
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: "Logged out successfully." });
});

// Get current user
router.get("/me", protect, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, theme, accentColor } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (theme) user.theme = theme;
    if (accentColor) user.accentColor = accentColor;

    if (email && email !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase() });
      if (taken)
        return res.status(400).json({ error: "Email already in use." });
      user.email = email.toLowerCase();
    }

    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Could not update profile." });
  }
});

// Change password
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ error: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Could not update password." });
  }
});

export default router;
