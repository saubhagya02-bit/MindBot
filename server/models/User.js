import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    theme: {
      type: String,
      enum: ["dark", "darker", "light", "teal", "rose", "green"],
      default: "dark",
    },
    accentColor: { type: String, default: "#4f8ef7" },
    // AI preferences: tier maps to a model; provider "default" uses the AI_PROVIDER env var
    aiTier: {
      type: String,
      enum: ["fast", "smart", "economy"],
      default: "fast",
    },
    aiProvider: {
      type: String,
      enum: ["default", "gemini", "openai"],
      default: "default",
    },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    theme: this.theme,
    accentColor: this.accentColor,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
