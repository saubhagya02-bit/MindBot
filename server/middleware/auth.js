import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError, ERROR_CODES } from "../utils/AppError.js";

const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

const resolveUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id).select("-password");
};

export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(
        new AppError(
          "Not authenticated. Please log in.",
          401,
          ERROR_CODES.AUTH_UNAUTHORIZED,
        ),
      );
    }

    const user = await resolveUser(token);
    if (!user) {
      return next(
        new AppError(
          "User no longer exists.",
          401,
          ERROR_CODES.AUTH_UNAUTHORIZED,
        ),
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await resolveUser(token);
      if (user) req.user = user;
    }
  } catch {}
  next();
};

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

export const sendTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};
