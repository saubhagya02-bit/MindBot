import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";

const ChatContext = createContext(null);

export function ChatProvider({ children, userId }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setStreamingText("");
    setIsStreaming(false);
    setLoadingHistory(true);
    if (!userId) {
      setLoadingHistory(false);
      return;
    }
    async function fetchSessions() {
      try {
        const res = await fetch(`/api/sessions?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error("Could not load sessions:", err.message);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchSessions();
  }, [userId]);

  const createSession = useCallback(() => {
    const id = uuidv4();
    setSessions((prev) => [
      {
        id,
        userId,
        title: "New conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
      },
      ...prev,
    ]);
    setActiveSessionId(id);
    setMessages([]);
    setError(null);
    return id;
  }, [userId]);

  const selectSession = useCallback(
    async (sessionId) => {
      if (sessionId === activeSessionId) return;
      setActiveSessionId(sessionId);
      setMessages([]);
      setError(null);
      try {
        const res = await fetch(`/api/sessions/${sessionId}?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Could not load session:", err.message);
      }
    },
    [activeSessionId, userId],
  );

  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        await fetch(`/api/sessions/${sessionId}?userId=${userId}`, {
          method: "DELETE",
        });
      } catch {}
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    },
    [activeSessionId, userId],
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

  const streamChat = useCallback(
    async (message, sessionId) => {
      let accumulated = "";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message, sessionId, userId }),
      });
      if (!response.ok) {
        let errMsg = `Server error ${response.status}`;
        try {
          const e = await response.json();
          errMsg = e.error || errMsg;
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
          const t = line.trim();
          if (!t || t.startsWith("event:")) continue;
          if (!t.startsWith("data:")) continue;
          const raw = t.slice(5).trim();
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
          } catch (pe) {
            if (
              pe.message &&
              !pe.message.includes("JSON") &&
              !pe.message.includes("Unexpected")
            )
              throw pe;
          }
        }
      }
      if (!accumulated)
        throw new Error("No response received. Please try again.");
      return accumulated;
    },
    [userId, updateSessionTitle],
  );

  // Send a brand new message
  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content?.trim();
      if (isStreaming || !trimmed) return;
      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = uuidv4();
        setSessions((prev) => [
          {
            id: sessionId,
            userId,
            title: trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : ""),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
          ...prev,
        ]);
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
        accumulated = await streamChat(trimmed, sessionId);
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: accumulated,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        setError(err.message || "Something went wrong.");
        if (!accumulated)
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [activeSessionId, isStreaming, userId, streamChat],
  );

  const editAndResend = useCallback(
    async (messageId, newContent) => {
      const trimmed = newContent?.trim();
      if (isStreaming || !trimmed) return;

      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      // History = everything BEFORE the edited message
      const historyBefore = messages.slice(0, msgIndex);

      // Updated message with edited flag
      const editedMsg = {
        ...messages[msgIndex],
        content: trimmed,
        timestamp: new Date().toISOString(),
        edited: true,
      };

      // Show: history + edited msg (old reply is gone)
      setMessages([...historyBefore, editedMsg]);
      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      const sessionId = activeSessionId;
      const originalMessages = messages;
      let accumulated = "";

      try {
        accumulated = await streamChat(trimmed, sessionId);
        setMessages([
          ...historyBefore,
          editedMsg,
          {
            id: uuidv4(),
            role: "assistant",
            content: accumulated,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        setError(err.message || "Something went wrong.");
        setMessages(originalMessages);
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [activeSessionId, isStreaming, messages, streamChat],
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
        editAndResend,
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
