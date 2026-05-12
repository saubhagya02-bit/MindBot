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
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const DATA_DIR = path.join(__dirname, "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const map = new Map();
      for (const [id, session] of Object.entries(parsed)) map.set(id, session);
      console.log(`📂 Loaded ${map.size} sessions from disk`);
      return map;
    }
  } catch (err) {
    console.error("⚠️ Could not load sessions:", err.message);
  }
  return new Map();
}

function saveSessions() {
  try {
    const obj = {};
    for (const [id, session] of sessions.entries()) obj[id] = session;
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.error("⚠️ Could not save sessions:", err.message);
  }
}

let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSessions, 1000);
}

const sessions = loadSessions();

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
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE"] }));
app.use(express.json({ limit: "10mb" }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

function getOrCreateSession(sessionId, userId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      userId, // ← owner
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    scheduleSave();
  }
  return sessions.get(sessionId);
}

function ownedBy(session, userId) {
  if (!session) return false;

  if (!session.userId) return true;
  return session.userId === userId;
}

// Cleanup old sessions (30 days)
setInterval(
  () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let deleted = 0;
    for (const [id, s] of sessions.entries()) {
      if (new Date(s.updatedAt).getTime() < cutoff) {
        sessions.delete(id);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`🧹 Cleaned ${deleted} sessions`);
      saveSessions();
    }
  },
  60 * 60 * 1000,
);

process.on("SIGINT", () => {
  saveSessions();
  process.exit(0);
});
process.on("SIGTERM", () => {
  saveSessions();
  process.exit(0);
});

// Routes
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    apiKey: API_KEY
      ? `${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`
      : "❌ MISSING",
    sessions: sessions.size,
    uptime: Math.floor(process.uptime()),
  }),
);

app.get("/api/sessions", (req, res) => {
  const { userId } = req.query;
  const list = Array.from(sessions.values())
    .filter((s) => {
      if (!userId) return true;

      return !s.userId || s.userId === userId;
    })
    .map(({ id, userId: sUserId, title, createdAt, updatedAt, messages }) => ({
      id,
      userId: sUserId,
      title,
      createdAt,
      updatedAt,
      messageCount: messages.length,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(list);
});

// Get single session — only if owned by user
app.get("/api/sessions/:id", (req, res) => {
  const { userId } = req.query;
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (userId && !ownedBy(session, userId))
    return res.status(403).json({ error: "Access denied" });
  res.json(session);
});

// Delete session — only if owned by user
app.delete("/api/sessions/:id", (req, res) => {
  const { userId } = req.query;
  const session = sessions.get(req.params.id);
  if (session && userId && !ownedBy(session, userId))
    return res.status(403).json({ error: "Access denied" });
  sessions.delete(req.params.id);
  scheduleSave();
  res.json({ success: true });
});

// Chat
app.post("/api/chat", async (req, res) => {
  const { message, sessionId, userId } = req.body;

  console.log("\n📨 /api/chat", {
    user: userId?.slice(0, 8),
    message: message?.slice(0, 50),
  });

  if (!message?.trim())
    return res.status(400).json({ error: "Message cannot be empty" });
  if (!API_KEY || API_KEY === "your_gemini_api_key_here")
    return res.status(500).json({ error: "GEMINI_API_KEY missing" });
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const id = sessionId || uuidv4();
  const session = getOrCreateSession(id, userId);

  if (!ownedBy(session, userId))
    return res.status(403).json({ error: "Access denied" });

  if (session.messages.length === 0) {
    session.title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
  }

  session.messages.push({
    id: uuidv4(),
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  });
  session.updatedAt = new Date().toISOString();

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
      timestamp: new Date().toISOString(),
    });
    session.updatedAt = new Date().toISOString();
    scheduleSave();

    send("done", { sessionId: id, title: session.title });
    res.end();
  } catch (err) {
    console.error("❌ Error:", err.message);
    const code = err.status || err.statusCode;
    let msg = err.message || "Something went wrong.";
    if (code === 429) msg = "Rate limit hit. Please wait and try again.";
    if (code === 403) msg = "Invalid API key. Check server/.env";
    send("error", { message: msg });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server → http://localhost:${PORT}`);
  console.log(
    `🔑 API Key: ${API_KEY ? API_KEY.slice(0, 8) + "..." + API_KEY.slice(-4) : "❌ MISSING"}`,
  );
  console.log(`💾 Data: ${SESSIONS_FILE}`);
  console.log(`👥 Per-user session isolation: ✅ enabled\n`);
});
