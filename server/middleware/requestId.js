import { randomUUID } from "crypto";
import logger from "../config/logger.js";

const requestId = (req, res, next) => {
  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("x-request-id", req.id);

  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level](
      {
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        latencyMs: ms,
        userId: req.user?._id?.toString() || "guest",
      },
      `${req.method} ${req.path} ${res.statusCode} ${ms}ms`,
    );
  });

  next();
};

export default requestId;
