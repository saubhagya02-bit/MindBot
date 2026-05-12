import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load all sessions from server on app start
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
          console.log(`📂 Loaded ${data.length} sessions from server`);
        }
      } catch (err) {
        console.error("Could not load sessions:", err.message);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchSessions();
  }, []);

  const createSession = useCallback(() => {
    const id = uuidv4();
    const session = {
      id,
      title: "New conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(id);
    setMessages([]);
    setError(null);
    return id;
  }, []);

  const selectSession = useCallback(
    async (sessionId) => {
      if (sessionId === activeSessionId) return;
      setActiveSessionId(sessionId);
      setMessages([]);
      setError(null);
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Could not load session:", err.message);
      }
    },
    [activeSessionId],
  );

  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      } catch {}
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    },
    [activeSessionId],
  );

  const updateSessionTitle = useCallback((sessionId, title) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content?.trim();
      if (isStreaming || !trimmed) return;

      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = uuidv4();
        const session = {
          id: sessionId,
          title: trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : ""),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        };
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(sessionId);
      }

      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      let accumulated = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ message: trimmed, sessionId }),
        });

        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
          let errMsg = `Server error ${response.status}`;
          try {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith("event:")) continue;
            if (!trimmedLine.startsWith("data:")) continue;

            const raw = trimmedLine.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;

            try {
              const data = JSON.parse(raw);

              if (typeof data.text === "string") {
                accumulated += data.text;
                setStreamingText(accumulated);
              }

              if (data.sessionId && data.title) {
                updateSessionTitle(data.sessionId, data.title);
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === data.sessionId
                      ? {
                          ...s,
                          messageCount: (s.messageCount || 0) + 2,
                          updatedAt: new Date().toISOString(),
                        }
                      : s,
                  ),
                );
              }

              if (data.message && !data.text && !data.sessionId) {
                if (!accumulated) throw new Error(data.message);
              }
            } catch (parseErr) {
              if (
                parseErr.message &&
                !parseErr.message.includes("JSON") &&
                !parseErr.message.includes("Unexpected token") &&
                !parseErr.message.includes("Unexpected end")
              ) {
                throw parseErr;
              }
            }
          }
        }

        if (!accumulated) {
          throw new Error("No response received. Please try again.");
        }

        const assistantMessage = {
          id: uuidv4(),
          role: "assistant",
          content: accumulated,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("Chat error:", err.message);
        setError(err.message || "Something went wrong. Please try again.");
        if (!accumulated) {
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        }
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [activeSessionId, isStreaming, updateSessionTitle],
  );

  return (
    <ChatContext.Provider
      value={{
        sessions,
        setSessions,
        activeSessionId,
        setActiveSessionId,
        messages,
        setMessages,
        isStreaming,
        streamingText,
        error,
        setError,
        sidebarOpen,
        setSidebarOpen,
        loadingHistory,
        createSession,
        selectSession,
        deleteSession,
        sendMessage,
        updateSessionTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
