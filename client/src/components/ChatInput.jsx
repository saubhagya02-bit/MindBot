import { useState, useRef, useEffect } from "react";
import { Send, LogIn, UserPlus } from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChatInput() {
  const { sendMessage, isStreaming } = useChat();
  const { user, guestCanChat, openAuthPrompt } = useAuth();
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

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // sendMessage handles the guest limit and resolves to null on failure
    const result = await sendMessage(trimmed);
    if (!result) setText((current) => current || trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOverLimit = text.length > 4000;
  const guestLocked = !user && !guestCanChat;

  if (guestLocked) {
    return (
      <div className="max-w-3xl mx-auto w-full flex flex-col items-center gap-3 py-4">
        <p
          className="text-sm text-center"
          style={{ color: "var(--text-muted)" }}
        >
          You've used your free message. Sign in or create an account to keep
          chatting.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAuthPrompt("login")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 border"
            style={{
              color: "var(--text)",
              borderColor: "var(--border2)",
              background: "var(--bg-800)",
            }}
          >
            <LogIn size={15} />
            Sign in
          </button>
          <button
            onClick={() => openAuthPrompt("register")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
            style={{ background: "var(--accent,#4f8ef7)" }}
          >
            <UserPlus size={15} />
            Create free account
          </button>
        </div>
      </div>
    );
  }

  const canSend = text.trim() && !isStreaming && !isOverLimit;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div
        className="flex items-end gap-3 rounded-2xl px-4 py-3 border transition-all duration-150"
        style={{
          background: "var(--bg-800)",
          borderColor: isOverLimit ? "#ef4444" : "var(--border2)",
        }}
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
          className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed disabled:opacity-50 min-h-[22px] max-h-[200px]"
          style={{ color: "var(--text)", caretColor: "var(--accent,#4f8ef7)" }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
          style={{
            background: canSend ? "var(--accent,#4f8ef7)" : "var(--bg-700)",
            color: canSend ? "#fff" : "var(--text-muted)",
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          <Send size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {!user ? (
            <span>
              ⚡ 1 free message ·{" "}
              <button
                onClick={() => openAuthPrompt("login")}
                className="underline hover:opacity-80"
              >
                Sign in
              </button>{" "}
              or{" "}
              <button
                onClick={() => openAuthPrompt("register")}
                className="underline hover:opacity-80"
              >
                sign up for unlimited
              </button>
            </span>
          ) : (
            <>
              <kbd
                className="px-1 py-0.5 rounded text-[10px] border"
                style={{
                  background: "var(--bg-700)",
                  borderColor: "var(--border2)",
                }}
              >
                Enter
              </kbd>{" "}
              to send ·{" "}
              <kbd
                className="px-1 py-0.5 rounded text-[10px] border"
                style={{
                  background: "var(--bg-700)",
                  borderColor: "var(--border2)",
                }}
              >
                Shift+Enter
              </kbd>{" "}
              new line
            </>
          )}
        </span>
        {text.length > 100 && (
          <span
            className="text-[11px]"
            style={{ color: isOverLimit ? "#ef4444" : "var(--text-muted)" }}
          >
            {text.length}/4000
          </span>
        )}
      </div>
    </div>
  );
}
