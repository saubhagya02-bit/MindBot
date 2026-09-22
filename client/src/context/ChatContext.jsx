import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { getApiErrorMessage } from "../utils/apiError.js";

const ChatContext = createContext(null);

const makeTitle = (text) => text.slice(0, 50) + (text.length > 50 ? "..." : "");

export function ChatProvider({ children, userId }) {
  const { user, guestCanChat, incrementGuestUsage, openAuthPrompt } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Reset + reload sessions when user changes
  useEffect(() => {
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setStreamingText("");
    setIsStreaming(false);
    setLoadingHistory(true);

    if (!userId || userId === "guest") {
      setLoadingHistory(false);
      return;
    }

    fetch("/api/sessions", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSessions(Array.isArray(data) ? data : data?.data || []);
      })
      .catch((err) => {
        console.error("Could not load sessions:", err);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [userId]);

  // Create temporary session
  const createSession = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    setSessions((prev) => [
      {
        id: tempId,
        title: "New conversation",
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
      },
      ...prev,
    ]);

    setActiveSessionId(tempId);
    setMessages([]);
    setError(null);

    return tempId;
  }, []);

  // Select existing session
  const selectSession = useCallback(
    async (sessionId) => {
      if (!sessionId || sessionId === activeSessionId) return;

      setActiveSessionId(sessionId);
      setMessages([]);
      setError(null);

      // Temporary sessions don't exist on the backend
      if (sessionId.startsWith("temp-")) return;

      try {
        const res = await fetch(`/api/sessions/${sessionId}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);

        const data = await res.json();
        setMessages(data?.messages || data?.data?.messages || []);
      } catch (err) {
        console.error("Could not load session:", err);
        setError(err.message || "Could not load conversation.");
      }
    },
    [activeSessionId],
  );

  // Delete session
  const deleteSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return;

      try {
        // Temporary sessions don't exist in MongoDB
        if (!sessionId.startsWith("temp-")) {
          const res = await fetch(`/api/sessions/${sessionId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        }
      } catch (err) {
        console.error("Could not delete session:", err);
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    },
    [activeSessionId],
  );

  // Update session title
  const updateSessionTitle = useCallback((sessionId, title) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
  }, []);

  // Send chat request
  const streamChat = useCallback(async (message, sessionId) => {
    const trimmed = message?.trim();
    if (!trimmed) throw new Error("Message cannot be empty.");

    // Never send temporary IDs to backend
    const isTemp = !sessionId || sessionId.startsWith("temp-");
    const realSessionId = isTemp ? null : sessionId;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message: trimmed, sessionId: realSessionId }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `Server error ${response.status}`;
      const raw = await response.text().catch(() => "");

      try {
        errorMessage = getApiErrorMessage(JSON.parse(raw), errorMessage);
      } catch {
        if (raw) errorMessage = raw;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data?.success) {
      throw new Error(getApiErrorMessage(data, "Chat request failed."));
    }

    const responseMessage = data?.data?.message;
    const returnedSessionId = data?.data?.sessionId;
    const title = data?.data?.title || makeTitle(trimmed);

    if (!responseMessage) throw new Error("No response received from the AI.");

    if (returnedSessionId) {
      setActiveSessionId(returnedSessionId);

      setSessions((prev) =>
        prev.map((session) => {
          if (isTemp && session.id === sessionId) {
            return {
              ...session,
              id: returnedSessionId,
              title,
              messageCount: 2,
              updatedAt: new Date().toISOString(),
            };
          }
          if (!isTemp && session.id === returnedSessionId) {
            return {
              ...session,
              title,
              messageCount: (session.messageCount || 0) + 2,
              updatedAt: new Date().toISOString(),
            };
          }
          return session;
        }),
      );
    }

    return {
      message: responseMessage,
      sessionId: returnedSessionId,
      title,
      model: data?.data?.model,
    };
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content?.trim();
      if (isStreaming || !trimmed) return null;

      // Guest trial gate — single place so every entry point is covered
      if (!user && !guestCanChat) {
        openAuthPrompt("register");
        return null;
      }

      let sessionId = activeSessionId;

      // Create temporary session locally
      if (!sessionId) {
        const tempId = `temp-${Date.now()}`;
        const now = new Date().toISOString();

        setSessions((prev) => [
          {
            id: tempId,
            title: makeTitle(trimmed),
            createdAt: now,
            updatedAt: now,
            messageCount: 0,
          },
          ...prev,
        ]);

        setActiveSessionId(tempId);
        sessionId = tempId;
      }

      const userMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      try {
        const responseData = await streamChat(trimmed, sessionId);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-ai`,
            role: "assistant",
            content: responseData.message,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Only burn the free trial message once it actually succeeded
        if (!user) incrementGuestUsage();

        return responseData;
      } catch (err) {
        console.error("sendMessage failed:", err);
        setError(err.message || "Something went wrong.");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        return null;
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [
      activeSessionId,
      isStreaming,
      streamChat,
      user,
      guestCanChat,
      incrementGuestUsage,
      openAuthPrompt,
    ],
  );

  // Edit existing message and resend
  const editAndResend = useCallback(
    async (messageId, newContent) => {
      const trimmed = newContent?.trim();
      if (isStreaming || !trimmed) return;

      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      const historyBefore = messages.slice(0, msgIndex);
      const editedMsg = {
        ...messages[msgIndex],
        content: trimmed,
        timestamp: new Date().toISOString(),
        edited: true,
      };
      const originalMessages = messages;

      setMessages([...historyBefore, editedMsg]);
      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      try {
        const responseData = await streamChat(trimmed, activeSessionId);

        setMessages([
          ...historyBefore,
          editedMsg,
          {
            id: `msg-${Date.now()}-ai`,
            role: "assistant",
            content: responseData.message,
            timestamp: new Date().toISOString(),
          },
        ]);

        return responseData;
      } catch (err) {
        console.error("editAndResend failed:", err);
        setError(err.message || "Something went wrong.");
        setMessages(originalMessages);
        throw err;
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
