import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () =>
  console.log("⚠️  MongoDB disconnected"),
);
mongoose.connection.on("reconnected", () =>
  console.log("✅ MongoDB reconnected"),
);

export default connectDB;
