import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

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
  "gemini-2.0-flash-lite-001",
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
      console.log(`⚠️  ${modelName} → ${code}: ${err.message?.slice(0, 80)}`);
      if (code === 429 || code === 404 || code === 400 || code === 403 || !code)
        continue;
      throw err;
    }
  }

  throw lastError || new Error("All models failed. Please try again later.");
}

//  Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE"] }));
app.use(express.json({ limit: "10mb" }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

//  Session Store
const sessions = new Map();

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      title: "New conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return sessions.get(sessionId);
}

setInterval(
  () => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, s] of sessions.entries()) {
      if (new Date(s.updatedAt).getTime() < cutoff) sessions.delete(id);
    }
  },
  30 * 60 * 1000,
);

//  Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKey: API_KEY
      ? `${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`
      : "❌ MISSING",
    models: MODELS,
    uptime: Math.floor(process.uptime()),
    sessions: sessions.size,
  });
});

app.get("/api/models", async (req, res) => {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
    );
    const data = await r.json();
    if (data.error) return res.status(400).json(data);
    const models = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({ name: m.name, displayName: m.displayName }));
    res.json({ total: models.length, models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sessions", (req, res) => {
  const id = uuidv4();
  const session = getOrCreateSession(id);
  res.json({ sessionId: session.id, title: session.title });
});

app.get("/api/sessions", (req, res) => {
  const list = Array.from(sessions.values())
    .map(({ id, title, createdAt, updatedAt, messages }) => ({
      id,
      title,
      createdAt,
      updatedAt,
      messageCount: messages.length,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(list);
});

app.get("/api/sessions/:id", (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "Session not found" });
  res.json(s);
});

app.delete("/api/sessions/:id", (req, res) => {
  sessions.delete(req.params.id);
  res.json({ success: true });
});

//  Chat
app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  console.log("\n📨 /api/chat →", {
    message: message?.slice(0, 60),
    sessionId,
  });

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }
  if (!API_KEY || API_KEY === "your_gemini_api_key_here") {
    return res
      .status(500)
      .json({ error: "GEMINI_API_KEY missing in server/.env" });
  }

  const id = sessionId || uuidv4();
  const session = getOrCreateSession(id);

  if (session.messages.length === 0) {
    session.title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
  }

  session.messages.push({
    id: uuidv4(),
    role: "user",
    content: message,
    timestamp: new Date(),
  });
  session.updatedAt = new Date();

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
    const history = session.messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const { result, modelName } = await tryStream(history, message);

    let fullText = "";
    send("start", { sessionId: id, model: modelName });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      send("chunk", { text });
    }

    session.messages.push({
      id: uuidv4(),
      role: "assistant",
      content: fullText,
      timestamp: new Date(),
    });
    session.updatedAt = new Date();

    send("done", { sessionId: id, title: session.title });
    res.end();
  } catch (err) {
    console.error("❌ Final error:", err.message);
    const code = err.status || err.statusCode;
    let msg = err.message || "Something went wrong.";
    if (code === 429) msg = "Rate limit hit. Please wait and try again.";
    if (code === 403) msg = "Invalid API key. Check server/.env";
    send("error", { message: msg });
    res.end();
  }
});

//  Start
app.listen(PORT, () => {
  console.log(`\n🚀 Server → http://localhost:${PORT}`);
  console.log(
    `🔑 API Key: ${API_KEY ? API_KEY.slice(0, 8) + "..." + API_KEY.slice(-4) : "❌ MISSING"}`,
  );
  console.log(`🤖 Using models: ${MODELS.join(", ")}`);
  console.log(`\n👉 Health: http://localhost:${PORT}/api/health\n`);
});
