import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    filename: { type: String, required: true },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    edited: { type: Boolean, default: false },
    // Files the user attached to this message (shown as chips in the chat)
    attachments: { type: [attachmentSchema], default: undefined },
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
    // Every file attached anywhere in this conversation. Follow-up questions
    // are answered from these files, so attaching once is enough.
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
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
