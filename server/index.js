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

/*  GEMINI SETUP  */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

/*  MIDDLEWARE  */
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please slow down." },
});

app.use("/api/", limiter);

/*  IN MEMORY STORAGE  */

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

/*  CLEANUP  */
setInterval(
  () => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;

    for (const [id, session] of sessions.entries()) {
      if (new Date(session.updatedAt).getTime() < cutoff) {
        sessions.delete(id);
      }
    }
  },
  30 * 60 * 1000,
);

/*  ROUTES  */

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    sessions: sessions.size,
    uptime: Math.floor(process.uptime()),
  });
});

// Create session
app.post("/api/sessions", (req, res) => {
  const sessionId = uuidv4();
  const session = getOrCreateSession(sessionId);

  res.json({
    sessionId: session.id,
    title: session.title,
  });
});

// Get session
app.get("/api/sessions/:sessionId", (req, res) => {
  const session = sessions.get(req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(session);
});

// List sessions
app.get("/api/sessions", (req, res) => {
  const list = Array.from(sessions.values())
    .map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json(list);
});

// Delete session
app.delete("/api/sessions/:sessionId", (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ success: true });
});

/*  CHAT API  */
app.post("/api/chat", async (req, res) => {
  const { messages, sessionId } = req.body;

  const message = Array.isArray(messages)
    ? messages[messages.length - 1]?.content
    : messages;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY in .env",
    });
  }

  const id = sessionId || uuidv4();
  const session = getOrCreateSession(id);

  // Set title for first message
  if (session.messages.length === 0) {
    session.title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
  }

  const userMsg = {
    id: uuidv4(),
    role: "user",
    content: message,
    timestamp: new Date(),
  };

  session.messages.push(userMsg);
  session.updatedAt = new Date();

  /*  SSE HEADERS  */
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
      generationConfig,
      systemInstruction:
        "You are a helpful AI assistant. Use markdown formatting when needed.",
    });

    const history = session.messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    const result = await chat.sendMessageStream(message);

    let fullText = "";

    sendEvent("start", { sessionId: id });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;

      sendEvent("chunk", { text });
    }

    const assistantMsg = {
      id: uuidv4(),
      role: "assistant",
      content: fullText,
      timestamp: new Date(),
    };

    session.messages.push(assistantMsg);
    session.updatedAt = new Date();

    sendEvent("done", {
      sessionId: id,
      messageId: assistantMsg.id,
    });

    res.end();
  } catch (err) {
    console.error(err);

    sendEvent("error", {
      message: err.message || "Something went wrong",
    });

    res.end();
  }
});

/*  START SERVER  */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📡 Gemini API: ${process.env.GEMINI_API_KEY ? "OK" : "MISSING"}`,
  );
});
