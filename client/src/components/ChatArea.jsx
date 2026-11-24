import { useEffect, useRef, useState } from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  AlertCircle,
  X,
  LogIn,
  Paperclip,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useAttachments } from "../hooks/useAttachments.js";
import MessageList from "./MessageList.jsx";
import ChatInput from "./ChatInput.jsx";
import WelcomeScreen from "./WelcomeScreen.jsx";

const hasFiles = (e) =>
  Array.from(e.dataTransfer?.types || []).includes("Files");

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
  const { user, setShowAccountSettings, openAuthPrompt } = useAuth();
  const attachments = useAttachments();
  const bottomRef = useRef(null);

  // Drag & drop anywhere on the chat area
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const handleDragEnter = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const handleDragOver = (e) => {
    if (hasFiles(e)) e.preventDefault();
  };

  const handleDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const handleDrop = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);

    if (!user) return openAuthPrompt("login");
    attachments.addFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div
      className="relative flex flex-col h-full transition-colors duration-200"
      style={{ background: "var(--bg-950)" }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {dragging && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          style={{
            background: "rgba(7,8,16,0.78)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="flex flex-col items-center gap-2 px-10 py-8 rounded-2xl border-2 border-dashed"
            style={{
              borderColor: "var(--accent,#4f8ef7)",
              color: "var(--text)",
            }}
          >
            <Paperclip size={26} style={{ color: "var(--accent,#4f8ef7)" }} />
            <div className="text-sm font-medium">Drop files to attach</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              PDF, DOCX or TXT · up to 10MB each
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
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

          {user ? (
            // Logged in: avatar opens account settings
            <button
              onClick={() => setShowAccountSettings(true)}
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: "var(--bg-800)",
                borderColor: "var(--border2)",
              }}
              title={`${user.name} — Account settings`}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--accent,#4f8ef7)",
                }}
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            </button>
          ) : (
            // Guest: explicit Sign in button
            <button
              onClick={() => openAuthPrompt("login")}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg text-white transition-all active:scale-95"
              style={{ background: "var(--accent,#4f8ef7)" }}
            >
              <LogIn size={14} /> Sign in
            </button>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
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

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3">
        <ChatInput attachments={attachments} />
      </div>
    </div>
  );
}
