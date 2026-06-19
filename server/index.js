import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import connectDB from "./config/db.js";
import Session from "./models/Session.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import { protect } from "./middleware/auth.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Gemini Setup
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const generationConfig = { temperature: 0.9, topP: 1, maxOutputTokens: 2048 };

const SYSTEM_PROMPT = `You are Gemini AI, a helpful, creative, and intelligent assistant.
When writing code, use proper markdown code blocks with language identifiers.
Be concise but thorough. Use markdown formatting when it helps clarity.`;

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash-001",
  "gemini-2.5-flash-lite",
];

async function tryStream(history, message) {
  let lastError = null;
  for (const modelName of MODELS) {
    try {
      console.log(`🤖 Trying: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig,
        systemInstruction: SYSTEM_PROMPT,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(message);
      console.log(`✅ Success: ${modelName}`);
      return { result, modelName };
    } catch (err) {
      lastError = err;
      const code = err.status || err.statusCode || 0;
      console.log(`⚠️  ${modelName} → ${code}`);
      if (code === 429 || code === 404 || code === 400 || code === 403 || !code)
        continue;
      throw err;
    }
  }
  throw lastError || new Error("All models failed.");
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Routes
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    apiKey: API_KEY
      ? `${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`
      : "❌ MISSING",
    uptime: Math.floor(process.uptime()),
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

// Chat Route
app.post("/api/chat", protect, async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user._id;

  console.log(
    `\n📨 /api/chat → user:${req.user.name} msg:${message?.slice(0, 50)}`,
  );

  if (!message?.trim())
    return res.status(400).json({ error: "Message cannot be empty." });
  if (!API_KEY)
    return res.status(500).json({ error: "GEMINI_API_KEY missing in .env" });

  // Get or create session in MongoDB
  let session;
  if (sessionId) {
    session = await Session.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: "Session not found." });
  } else {
    session = await Session.create({
      userId,
      title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
      messages: [],
    });
  }

  // Add user message to DB
  session.messages.push({ role: "user", content: message.trim() });
  if (session.messages.length === 1) {
    session.title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
  }
  await session.save();

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event, data) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {}
  };

  try {
    // Build Gemini history from DB messages (exclude last user message)
    const history = session.messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const { result, modelName } = await tryStream(history, message.trim());
    let fullText = "";
    send("start", { sessionId: session._id.toString(), model: modelName });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      send("chunk", { text });
    }

    // Save AI reply to DB
    session.messages.push({ role: "assistant", content: fullText });
    session.model = modelName;
    await session.save();

    send("done", { sessionId: session._id.toString(), title: session.title });
    res.end();
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    const code = err.status || err.statusCode;
    let msg = err.message || "Something went wrong.";
    if (code === 429) msg = "Rate limit hit. Please wait and try again.";
    if (code === 403) msg = "Invalid API key. Check server/.env";
    send("error", { message: msg });
    res.end();
  }
});

// Start
app.listen(PORT, () => {
  console.log(`\n🚀 Server → http://localhost:${PORT}`);
  console.log(
    `🔑 API Key: ${API_KEY ? API_KEY.slice(0, 8) + "..." + API_KEY.slice(-4) : "❌ MISSING"}`,
  );
  console.log(
    `🗄️  MongoDB: ${process.env.MONGODB_URI ? "✅ URI set" : "❌ MONGODB_URI missing"}`,
  );
  console.log(`🤖 Models: ${MODELS.slice(0, 3).join(", ")} + more\n`);
});
