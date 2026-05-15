import { useEffect, useRef } from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  AlertCircle,
  X,
  Settings,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import MessageList from "./MessageList.jsx";
import ChatInput from "./ChatInput.jsx";
import WelcomeScreen from "./WelcomeScreen.jsx";

export default function ChatArea() {
  const {
    messages,
    isStreaming,
    streamingText,
    error,
    setError,
    activeSessionId,
    sessions,
    sidebarOpen,
    setSidebarOpen,
    createSession,
  } = useChat();
  const { user, setShowAccountSettings, setShowAuthPrompt } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div
      className="flex flex-col h-full transition-colors duration-200"
      style={{ background: "var(--bg-950)" }}
    >
      <header
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ background: "var(--bg-950)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-800)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>

          <span
            className="text-sm font-medium truncate max-w-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {activeSession?.title || "MindBot Chat"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* New chat */}
          <button
            onClick={createSession}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{ color: "var(--text-muted)", borderColor: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-800)";
              e.currentTarget.style.borderColor = "var(--border2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Plus size={14} /> New chat
          </button>

          {/* User avatar — opens account settings */}
          <button
            onClick={() =>
              user ? setShowAccountSettings(true) : setShowAuthPrompt(true)
            }
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: "var(--bg-800)",
              borderColor: "var(--border2)",
            }}
            title={user ? `${user.name} — Account settings` : "Sign in"}
          >
            {user ? (
              <span
                className="text-[12px] font-bold"
                style={{ color: "var(--accent,#4f8ef7)" }}
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            ) : (
              <Settings size={14} style={{ color: "var(--text-muted)" }} />
            )}
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg border flex-shrink-0"
          style={{
            background: "rgba(239,68,68,0.1)",
            borderColor: "rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1 text-xs leading-relaxed">{error}</span>
          <button
            onClick={() => setError(null)}
            className="opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {showWelcome ? (
          <WelcomeScreen />
        ) : (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingText={streamingText}
          />
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-4 pb-5 pt-3">
        <ChatInput />
      </div>
    </div>
  );
}
