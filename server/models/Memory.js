import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fact: { type: String, required: true },
    embedding: { type: [Number], required: true },
    importance: { type: Number, min: 1, max: 5, default: 3 },
  },
  { timestamps: true },
);

export default mongoose.model("Memory", memorySchema);
