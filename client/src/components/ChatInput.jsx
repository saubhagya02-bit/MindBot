import { useState, useRef, useEffect } from "react";
import { Send, LogIn } from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChatInput() {
  const { sendMessage, isStreaming } = useChat();
  const { user, guestCanChat, incrementGuestUsage, setShowAuthPrompt } =
    useAuth();
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    if (!user && !guestCanChat) {
      setShowAuthPrompt(true);
      return;
    }

    // If guest, track usage
    if (!user) incrementGuestUsage();

    sendMessage(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > 4000;
  const guestLocked = !user && !guestCanChat;

  return (
    <div className="max-w-3xl mx-auto w-full">
      {guestLocked ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-slate-500 text-sm text-center">
            You've used your free message. Sign up to continue chatting for
            free.
          </p>
          <button
            onClick={() => setShowAuthPrompt(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gem-500 hover:bg-gem-600 text-white rounded-xl text-sm font-medium transition-all active:scale-95"
          >
            <LogIn size={15} />
            Create free account
          </button>
        </div>
      ) : (
        <>
          <div
            className={`flex items-end gap-3 bg-base-800 border rounded-2xl px-4 py-3 transition-all duration-150 ${
              isOverLimit
                ? "border-red-500/50"
                : "border-base-700/60 focus-within:border-gem-500/50 focus-within:shadow-lg focus-within:shadow-gem-500/10"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !user ? "Try MindBot for free… (1 message)" : "Message MindBot…"
              }
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm resize-none outline-none leading-relaxed disabled:opacity-50 min-h-[22px] max-h-[200px]"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || isStreaming || isOverLimit}
              className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${
                text.trim() && !isStreaming && !isOverLimit
                  ? "bg-gem-500 hover:bg-gem-600 text-white shadow-md shadow-gem-500/30 active:scale-95"
                  : "bg-base-700 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] text-slate-700">
              {!user ? (
                <span className="text-amber-600/80">
                  ⚡ 1 free message ·{" "}
                  <button
                    onClick={() => setShowAuthPrompt(true)}
                    className="underline hover:text-amber-500"
                  >
                    Sign up for unlimited
                  </button>
                </span>
              ) : (
                <>
                  <kbd className="bg-base-800 border border-base-700 px-1 py-0.5 rounded text-[10px]">
                    Enter
                  </kbd>{" "}
                  to send ·{" "}
                  <kbd className="bg-base-800 border border-base-700 px-1 py-0.5 rounded text-[10px]">
                    Shift+Enter
                  </kbd>{" "}
                  new line
                </>
              )}
            </span>
            {charCount > 100 && (
              <span
                className={`text-[11px] ${isOverLimit ? "text-red-400" : "text-slate-700"}`}
              >
                {charCount}/4000
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
