import { useState } from "react";
import { Copy, Check, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/disk/esm/styles/prism";

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
      className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-xs py-0.5 px-1.5 rounded"
    >
      <Copy size={13} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ language, children }) {
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-base-700/60">
      <div className="code-header">
        <span className="text-slate-500">{language || "code"}</span>
        <CopyButton text={String(children)} />
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "#0d0f1a",
          fontSize: "13px",
          padding: "16px",
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
          <div className="w-7 h-7 rounded-lg bg-base-700 border border-base-600 flex items-center justify-center">
            <User size={13} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex flex-col max-w-[85%] ${isAI ? "items-start" : "items-end"}`}
      >
        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAI
              ? "bg-base-800/70 border border-base-700/50 rounded-tl-sm"
              : "bg-gem-500/15 border border-gem-500/25 rounded-tr-sm"
          }`}
        >
          {isStreaming && !isStreamingContent && (
            <div className="flex items-center gap-1.5 py-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}

          {!isStreaming && message.content === "" ? null : isAI ? (
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
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {message.content || ""}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-200 whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {isAI && message.content && !isStreaming && (
          <div
            className={`mt-1 transition-opacity duration-150 ${
              showCopy ? "opacity-100" : "opacity-0"
            }`}
          >
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
