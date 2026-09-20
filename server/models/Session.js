import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    edited: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New conversation", maxlength: 100 },
    messages: [messageSchema],
    model: { type: String, default: "gemini-2.5-flash" },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

sessionSchema.pre("save", function (next) {
  this.messageCount = this.messages.length;
  next();
});

sessionSchema.index({ userId: 1, updatedAt: -1 });
sessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export default mongoose.model("Session", sessionSchema);
