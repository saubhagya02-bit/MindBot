import { useState } from "react";
import { Copy, Check, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext.jsx";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs py-0.5 px-1.5 rounded transition-colors"
      style={{ color: copied ? "#34d399" : "var(--text-muted)" }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
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
          borderColor: "var(--border)",
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        <span className="text-[11px]" style={{ color: "#64748b" }}>
          {language || "code"}
        </span>
        <CopyButton text={String(children)} />
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

export default function Message({
  message,
  isStreaming = false,
  isStreamingContent = false,
}) {
  const [showCopy, setShowCopy] = useState(false);
  const { user, setShowAccountSettings } = useAuth();
  const isAI = message.role === "assistant";

  return (
    <div
      className={`flex gap-3 group message-appear ${isAI ? "flex-row" : "flex-row-reverse"}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isAI ? (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
        ) : (
          /* User avatar — click opens account settings */
          <button
            onClick={() => user && setShowAccountSettings(true)}
            className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: "var(--bg-700)",
              borderColor: "var(--accent,#4f8ef7)66",
            }}
            title={user ? "Account settings" : ""}
          >
            {user ? (
              <span
                className="text-[11px] font-bold"
                style={{ color: "var(--accent,#4f8ef7)" }}
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
            ) : (
              <User size={13} style={{ color: "var(--accent,#4f8ef7)" }} />
            )}
          </button>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`flex flex-col max-w-[85%] ${isAI ? "items-start" : "items-end"}`}
      >
        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed border ${isAI ? "rounded-tl-sm" : "rounded-tr-sm"}`}
          style={
            isAI
              ? {
                  background: "var(--bg-800)",
                  borderColor: "var(--border2)",
                  color: "var(--text)",
                }
              : {
                  background: "var(--accent,#4f8ef7)22",
                  borderColor: "var(--accent,#4f8ef7)55",
                  color: "var(--text)",
                }
          }
        >
          {/* Typing dots */}
          {isStreaming && !isStreamingContent && (
            <div className="flex items-center gap-1.5 py-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}

          {/* Content */}
          {isAI ? (
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
                      <p
                        style={{ color: "var(--text)", marginBottom: "0.6rem" }}
                      >
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
                          color: "var(--text)",
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
          ) : (
            <p className="whitespace-pre-wrap" style={{ color: "var(--text)" }}>
              {message.content}
            </p>
          )}
        </div>

        {/* Copy button */}
        {isAI && message.content && !isStreaming && (
          <div
            className={`mt-1 transition-opacity duration-150 ${showCopy ? "opacity-100" : "opacity-0"}`}
          >
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
