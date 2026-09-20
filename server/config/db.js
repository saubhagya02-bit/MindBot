import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info({ host: conn.connection.host }, "✅ MongoDB connected");
  } catch (err) {
    logger.error({ err }, "❌ MongoDB connection failed");

    throw err;
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("✅ MongoDB reconnected");
});

export default connectDB;
