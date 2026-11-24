import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Sparkles,
  User,
  Edit2,
  X,
  CornerDownRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import AttachmentChip from "./AttachmentChip.jsx";

function CopyButton({ text, small = false }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded transition-colors"
      style={{
        fontSize: small ? "11px" : "12px",
        padding: small ? "2px 6px" : "3px 8px",
        color: copied ? "#34d399" : "var(--text-muted)",
      }}
    >
      {copied ? (
        <Check size={small ? 11 : 13} />
      ) : (
        <Copy size={small ? 11 : 13} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ language, children }) {
  return (
    <div
      className="my-3 rounded-xl overflow-hidden border"
      style={{ borderColor: "var(--border2)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: "#0d0f1a",
          borderColor: "#1b1f2e",
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        <span style={{ fontSize: "11px", color: "#64748b" }}>
          {language || "code"}
        </span>
        <CopyButton text={String(children)} small />
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "#0d0f1a",
          fontSize: "13px",
          padding: "14px",
        }}
        showLineNumbers={String(children).split("\n").length > 5}
        lineNumberStyle={{
          color: "#2e3452",
          fontSize: "11px",
          minWidth: "2.5em",
        }}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

const MAX_EDIT_LENGTH = 4000;

const KBD_STYLE = {
  background: "var(--bg-700)",
  border: "1px solid var(--border2)",
  padding: "1px 5px",
  borderRadius: "4px",
  fontFamily: "monospace",
  fontSize: "10px",
};

// User message bubble with inline editing (ChatGPT / Claude style):
// hover to reveal Copy + Edit; editing opens a full-width editor, and saving
// replaces this message and every reply after it.

function UserBubble({ message }) {
  const { editAndResend, isStreaming } = useChat();
  const { user, setShowAccountSettings, setShowAuthPrompt } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const textareaRef = useRef(null);

  const trimmed = editText.trim();
  const unchanged = trimmed === message.content.trim();
  const tooLong = editText.length > MAX_EDIT_LENGTH;

  const canSave = Boolean(trimmed) && !unchanged && !tooLong && !isStreaming;

  const autosize = (ta) => {
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 300)}px`;
  };

  useEffect(() => {
    if (!editing || !textareaRef.current) return;

    const ta = textareaRef.current;
    ta.focus();
    autosize(ta);
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, [editing]);

  const startEditing = () => {
    setEditText(message.content);
    setEditing(true);
  };

  const cancel = () => {
    setEditText(message.content);
    setEditing(false);
  };

  const save = () => {
    if (!canSave) return;

    setEditing(false);
    editAndResend(message.id, trimmed);
  };

  const handleKey = (e) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div className="group flex gap-3 message-appear flex-row-reverse">
      {/* User Avatar */}
      <button
        onClick={() =>
          user ? setShowAccountSettings(true) : setShowAuthPrompt(true)
        }
        aria-label="User account"
        className="w-8 h-8 rounded-xl border flex items-center justify-center
        flex-shrink-0 mt-1 transition-transform hover:scale-105"
        style={{
          background: "var(--bg-700)",
          borderColor: "var(--accent,#4f8ef7)66",
        }}
      >
        {user ? (
          <span
            className="text-xs font-bold"
            style={{ color: "var(--accent,#4f8ef7)" }}
          >
            {user.name?.charAt(0)?.toUpperCase()}
          </span>
        ) : (
          <User size={14} style={{ color: "var(--accent,#4f8ef7)" }} />
        )}
      </button>

      <div
        className={`flex flex-col items-end min-w-0 ${
          editing ? "w-full max-w-[760px]" : "max-w-[85%]"
        }`}
      >
        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 mb-2">
            {message.attachments.map((a) => (
              <AttachmentChip key={a.documentId} name={a.filename} />
            ))}
          </div>
        )}

        {editing ? (
          /* Professional Edit Interface */
          <div className="w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div
              className="w-full rounded-2xl border overflow-hidden transition-all duration-200"
              style={{
                background: "var(--bg-800)",
                borderColor: "var(--accent,#4f8ef7)",
                boxShadow: "0 0 0 3px var(--accent,#4f8ef7)18",
              }}
            >
              {/* Editor Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-700)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Edit2 size={14} style={{ color: "var(--accent,#4f8ef7)" }} />

                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    Edit message
                  </span>
                </div>

                <button
                  onClick={cancel}
                  aria-label="Close editor"
                  className="p-1 rounded-md hover:bg-white/5 transition-colors"
                  title="Cancel editing"
                >
                  <X size={15} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {/* Textarea */}
              <div className="px-4 pt-3 pb-2">
                <textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={(e) => {
                    setEditText(e.target.value);
                    autosize(e.target);
                  }}
                  onKeyDown={handleKey}
                  aria-label="Edit message"
                  placeholder="Edit your message..."
                  rows={1}
                  maxLength={MAX_EDIT_LENGTH + 1}
                  className="w-full bg-transparent text-sm leading-relaxed
                  outline-none resize-none border-0 focus:ring-0"
                  style={{
                    color: "var(--text)",
                    minHeight: "65px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    caretColor: "var(--accent,#4f8ef7)",
                  }}
                />
              </div>

              {/* Editor Footer */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t"
                style={{
                  borderColor: "var(--border)",
                }}
              >
                {/* Character Counter */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[11px]"
                    style={{
                      color: tooLong ? "#ef4444" : "var(--text-muted)",
                    }}
                  >
                    {editText.length.toLocaleString()} / {MAX_EDIT_LENGTH}
                  </span>

                  {tooLong && (
                    <span className="text-[10px] text-red-400">
                      Message exceeds the character limit.
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancel}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium
                    border transition-all hover:bg-white/5 active:scale-95"
                    style={{
                      color: "var(--text-muted)",
                      borderColor: "var(--border2)",
                      background: "transparent",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={save}
                    disabled={!canSave}
                    title={
                      unchanged
                        ? "Make a change before submitting"
                        : "Save changes and regenerate the response"
                    }
                    className="flex items-center gap-2 px-4 py-2
                    rounded-lg text-xs font-semibold text-white
                    transition-all hover:brightness-110 active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--accent,#4f8ef7)",
                    }}
                  >
                    <CornerDownRight size={14} />
                    Save & Submit
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div
              className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 mt-2 px-1"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="text-[10px]">
                <kbd style={KBD_STYLE}>Enter</kbd> Submit
              </span>

              <span className="text-[10px]">
                <kbd style={KBD_STYLE}>Shift + Enter</kbd> New line
              </span>

              <span className="text-[10px]">
                <kbd style={KBD_STYLE}>Esc</kbd> Cancel
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Normal User Message */}
            <div
              className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm
              leading-relaxed border transition-colors"
              style={{
                background: "var(--accent,#4f8ef7)18",
                borderColor: "var(--accent,#4f8ef7)40",
                color: "var(--text)",
              }}
            >
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>

            {/* Message Actions */}
            <div
              className="flex items-center gap-2 mt-1.5 px-1
              opacity-0 group-hover:opacity-100 focus-within:opacity-100
              transition-opacity duration-200"
            >
              {message.edited && (
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Edited
                </span>
              )}

              <CopyButton text={message.content} small />

              {user && (
                <button
                  onClick={startEditing}
                  disabled={isStreaming}
                  aria-label="Edit message"
                  title={
                    isStreaming
                      ? "Wait for the response to finish"
                      : "Edit message"
                  }
                  className="flex items-center gap-1.5 px-2 py-1
                  rounded-md text-[11px] transition-all
                  hover:bg-white/5 disabled:opacity-40"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Edit2 size={12} />
                  Edit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// AI message bubble
function AIBubble({ message, isStreaming, isStreamingContent }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="flex gap-3 message-appear flex-row"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles size={13} className="text-white" />
      </div>

      <div className="flex flex-col items-start max-w-[85%]">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed border"
          style={{
            background: "var(--bg-800)",
            borderColor: "var(--border2)",
            color: "var(--text)",
          }}
        >
          {/* Typing indicator */}
          {isStreaming && !isStreamingContent && (
            <div className="flex items-center gap-1.5 py-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}

          {/* Markdown content */}
          <div
            className={`prose-custom ${isStreamingContent ? "streaming-cursor" : ""}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                  ) : (
                    <code
                      style={{
                        background: "rgba(0,0,0,0.15)",
                        color: "var(--accent,#4f8ef7)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: "0.85em",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                p({ children }) {
                  return (
                    <p style={{ color: "var(--text)", marginBottom: "0.6rem" }}>
                      {children}
                    </p>
                  );
                },
                strong({ children }) {
                  return (
                    <strong style={{ color: "var(--text)", fontWeight: 700 }}>
                      {children}
                    </strong>
                  );
                },
                li({ children }) {
                  return <li style={{ color: "var(--text)" }}>{children}</li>;
                },
                h1({ children }) {
                  return (
                    <h1
                      style={{
                        color: "var(--text)",
                        fontWeight: 700,
                        fontSize: "1.3rem",
                        margin: "0.8rem 0 0.4rem",
                      }}
                    >
                      {children}
                    </h1>
                  );
                },
                h2({ children }) {
                  return (
                    <h2
                      style={{
                        color: "var(--text)",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        margin: "0.7rem 0 0.35rem",
                      }}
                    >
                      {children}
                    </h2>
                  );
                },
                h3({ children }) {
                  return (
                    <h3
                      style={{
                        color: "var(--text)",
                        fontWeight: 600,
                        fontSize: "1rem",
                        margin: "0.6rem 0 0.3rem",
                      }}
                    >
                      {children}
                    </h3>
                  );
                },
                blockquote({ children }) {
                  return (
                    <blockquote
                      style={{
                        borderLeft: "3px solid var(--accent,#4f8ef7)",
                        paddingLeft: "1rem",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                        margin: "0.5rem 0",
                      }}
                    >
                      {children}
                    </blockquote>
                  );
                },
                a({ children, href }) {
                  return (
                    <a
                      href={href}
                      style={{
                        color: "var(--accent,#4f8ef7)",
                        textDecoration: "underline",
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        margin: "0.5rem 0",
                      }}
                    >
                      {children}
                    </table>
                  );
                },
                th({ children }) {
                  return (
                    <th
                      style={{
                        padding: "0.4rem 0.7rem",
                        background: "var(--bg-700)",
                        fontWeight: 600,
                        textAlign: "left",
                        fontSize: "0.85rem",
                        color: "var(--text)",
                      }}
                    >
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td
                      style={{
                        padding: "0.4rem 0.7rem",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      {children}
                    </td>
                  );
                },
              }}
            >
              {message.content || ""}
            </ReactMarkdown>
          </div>
        </div>

        {/* Copy button */}
        {message.content && !isStreaming && (
          <div
            className={`mt-1 transition-opacity duration-150 ${showActions ? "opacity-100" : "opacity-0"}`}
          >
            <CopyButton text={message.content} small />
          </div>
        )}
      </div>
    </div>
  );
}

// Export
export default function Message({
  message,
  isStreaming = false,
  isStreamingContent = false,
}) {
  if (message.role === "user") return <UserBubble message={message} />;
  return (
    <AIBubble
      message={message}
      isStreaming={isStreaming}
      isStreamingContent={isStreamingContent}
    />
  );
}
