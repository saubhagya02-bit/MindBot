import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";

export default function ChatInput() {
  const { sendMessage, isStreaming } = useChat();
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  //Auto resize textarea
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
    sendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > 4000;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div
        className={`flex items-end gap-3 bg-base-800 border rounded-2xl px-4 py-3 transition-all duration-150 ${
          isOverLimit
            ? "border-red-500/50 shadow-lg shadow-red-500/10"
            : "border-base-700/60 focus-within:border-gem-500/50 focus-within:shadow-lg focus-within:shadow-gem-500/10"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message MindBot..."
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
          {isStreaming ? (
            <Square size={13} className="fill-current" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[11px] text-slate-700">
          Press{" "}
          <kbd className="bg-base-800 border border-base-700 px-1 py-0.5 rounded text-[10px]">
            Enter
          </kbd>{" "}
          to send,{" "}
          <kbd className="bg-base-800 border border-base-700 px-1 py-0.5 rounded text-[10px]">
            Shift+Enter
          </kbd>{" "}
          for new line
        </span>
        {charCount > 100 && (
          <span
            className={`text-[11px] ${isOverLimit ? "text-red-400" : "text-slate-700"}`}
          >
            {charCount}/4000
          </span>
        )}
      </div>
    </div>
  );
}
