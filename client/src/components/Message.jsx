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

// Editable user message
function UserBubble({ message }) {
  const { sendMessage, isStreaming } = useChat();
  const { user, setShowAccountSettings, setShowAuthPrompt } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const handleSendEdit = () => {
    if (!editText.trim() || isStreaming) return;
    sendMessage(editText.trim());
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendEdit();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setEditText(message.content);
    }
  };

  return (
    <div
      className="flex gap-3 group message-appear flex-row-reverse"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <button
        onClick={() =>
          user ? setShowAccountSettings(true) : setShowAuthPrompt(true)
        }
        className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-110 flex-shrink-0 mt-1"
        style={{
          background: "var(--bg-700)",
          borderColor: "var(--accent,#4f8ef7)66",
        }}
        title={user ? "Account settings" : "Sign in"}
      >
        {user ? (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--accent,#4f8ef7)",
            }}
          >
            {user.name?.charAt(0)?.toUpperCase()}
          </span>
        ) : (
          <User size={13} style={{ color: "var(--accent,#4f8ef7)" }} />
        )}
      </button>

      <div className="flex flex-col items-end max-w-[85%]">
        {/* Bubble */}
        {editing ? (
          <div
            className="w-full rounded-2xl rounded-tr-sm border overflow-hidden"
            style={{
              background: "var(--bg-800)",
              borderColor: "var(--accent,#4f8ef7)66",
            }}
          >
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={handleKey}
              className="w-full bg-transparent text-sm px-4 pt-3 pb-2 outline-none resize-none leading-relaxed"
              style={{ color: "var(--text)", minHeight: "44px" }}
            />
            <div className="flex items-center justify-end gap-2 px-3 pb-2.5">
              <button
                onClick={() => {
                  setEditing(false);
                  setEditText(message.content);
                }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all"
                style={{
                  color: "var(--text-muted)",
                  borderColor: "var(--border2)",
                }}
              >
                <X size={11} /> Cancel
              </button>
              <button
                onClick={handleSendEdit}
                disabled={!editText.trim() || isStreaming}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white transition-all disabled:opacity-50"
                style={{ background: "var(--accent,#4f8ef7)" }}
              >
                <CornerDownRight size={11} /> Send
              </button>
            </div>
          </div>
        ) : (
          <div
            className="relative rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed border"
            style={{
              background: "var(--accent,#4f8ef7)22",
              borderColor: "var(--accent,#4f8ef7)55",
              color: "var(--text)",
            }}
          >
            <p className="whitespace-pre-wrap" style={{ color: "var(--text)" }}>
              {message.content}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {!editing && (
          <div
            className={`flex items-center gap-1 mt-1 transition-opacity duration-150 ${showActions ? "opacity-100" : "opacity-0"}`}
          >
            <CopyButton text={message.content} small />
            <button
              onClick={() => {
                setEditing(true);
                setEditText(message.content);
              }}
              disabled={isStreaming}
              className="flex items-center gap-1 rounded transition-colors disabled:opacity-40"
              style={{
                fontSize: "11px",
                padding: "2px 6px",
                color: "var(--text-muted)",
              }}
            >
              <Edit2 size={11} /> Edit
            </button>
          </div>
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
      className="flex gap-3 group message-appear flex-row"
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
          {/* Typing dots */}
          {isStreaming && !isStreamingContent && (
            <div className="flex items-center gap-1.5 py-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}

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
