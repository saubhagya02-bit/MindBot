import { useEffect, useRef } from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  AlertCircle,
  X,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
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

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full bg-base-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-base-800/60 bg-base-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-base-800"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>

          <span className="text-sm text-slate-400 truncate max-w-xs font-medium">
            {activeSession?.title || "MindBot Chat"}
          </span>
        </div>

        <button
          onClick={createSession}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-200 text-xs px-3 py-1.5 rounded-lg hover:bg-base-800 transition-all border border-transparent hover:border-base-700"
        >
          <Plus size={14} />
          New chat
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex-shrink-0 animate-fade-up">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1 text-xs leading-relaxed">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500/60 hover:text-red-400 ml-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages area */}
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
        <ChatInput />
      </div>
    </div>
  );
}
