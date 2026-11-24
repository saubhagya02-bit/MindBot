import { useState, useRef, useEffect } from "react";
import { Send, LogIn, UserPlus, Paperclip } from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AttachmentChip from "./AttachmentChip.jsx";

const DEFAULT_FILE_PROMPT = "Please summarize the attached file(s).";

export default function ChatInput({ attachments }) {
  const { sendMessage, isStreaming } = useChat();
  const { user, guestCanChat, openAuthPrompt } = useAuth();
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    items,
    addFiles,
    remove,
    clear,
    restore,
    readyItems,
    isUploading,
    isFull,
  } = attachments;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const isOverLimit = text.length > 4000;
  const canSend =
    !isStreaming &&
    !isUploading &&
    !isOverLimit &&
    (text.trim().length > 0 || readyItems.length > 0);

  const handleAttachClick = () => {
    // File uploads need an account
    if (!user) return openAuthPrompt("login");
    fileInputRef.current?.click();
  };

  const handleFilesPicked = (e) => {
    addFiles(e.target.files);
    e.target.value = ""; // allow picking the same file again
  };

  const handleSend = async () => {
    if (!canSend) return;

    const trimmed = text.trim();
    const snapshot = items;
    const documents = readyItems.map((i) => ({
      documentId: i.documentId,
      filename: i.name,
    }));

    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    clear();

    // sendMessage handles the guest limit and resolves to null on failure
    const result = await sendMessage(trimmed || DEFAULT_FILE_PROMPT, {
      attachments: documents,
    });

    if (!result) {
      setText((current) => current || trimmed);
      restore(snapshot);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div
        className="rounded-2xl border transition-all duration-150"
        style={{
          background: "var(--bg-800)",
          borderColor: isOverLimit ? "#ef4444" : "var(--border2)",
        }}
      >
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {items.map((item) => (
              <AttachmentChip
                key={item.localId}
                name={item.name}
                status={item.status}
                error={item.error}
                size={item.size}
                progress={item.progress}
                onRemove={() => remove(item.localId)}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-3">
          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isStreaming || (user && isFull)}
            title={
              !user
                ? "Sign in to attach files"
                : isFull
                  ? "Maximum 5 files"
                  : "Attach PDF, DOCX or TXT"
            }
            aria-label="Attach files"
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--text-muted)" }}
          >
            <Paperclip size={17} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFilesPicked}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !user
                ? "Try MindBot for free… (1 message)"
                : readyItems.length > 0
                  ? "Ask something about your file…"
                  : "Message MindBot…"
            }
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed disabled:opacity-50 min-h-[22px] max-h-[200px] py-1.5"
            style={{
              color: "var(--text)",
              caretColor: "var(--accent,#4f8ef7)",
            }}
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
          ) : isUploading ? (
            <span>Uploading files…</span>
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
