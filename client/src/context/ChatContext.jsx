import { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const createSession = useCallback(() => {
    const id = uuidv4();
    const session = {
      id,
      title: "New conversion",
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

  const selectSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      setMessages([]);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionId) => {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
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
      if (isStreaming || !content.trim()) return;

      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = uuidv4();
        const session = {
          id: sessionId,
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),

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
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: content, sessionId }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Server error");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("/n");
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith("event: ")) continue;
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.text) {
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
                          messageCount: s.messageCount + 2,
                          updatedAt: new Date().toISOString(),
                        }
                      : s,
                  ),
                );
              }

              if (data.message) {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr;
              }
            }
          }
        }

        const assistantMessage = {
          id: uuidv4(),
          role: "assistant",
          content: accumulated,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err.message || "Something went wrong");
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
        sendMessage,
        isStreaming,
        setIsStreamingText,
        error,
        setError,
        sidebarOpen,
        setSidebarOpen,
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
