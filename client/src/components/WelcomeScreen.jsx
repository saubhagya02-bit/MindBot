import {
  Sparkles,
  Code2,
  PenLine,
  Globe,
  Lightbulb,
  Calculator,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";

const suggestions = [
  {
    icon: <Code2 size={18} />,
    title: "Write code",
    prompt:
      "Write a Python function to fetch and display weather data from an API",
    color: "#4f8ef7",
  },
  {
    icon: <PenLine size={18} />,
    title: "Creative writing",
    prompt:
      "Write a short sci-fi story about an AI that discovers it is dreaming",
    color: "#8b5cf6",
  },
  {
    icon: <Globe size={18} />,
    title: "Explain a concept",
    prompt:
      "Explain how the internet works, from typing a URL to seeing the page",
    color: "#14b8a6",
  },
  {
    icon: <Lightbulb size={18} />,
    title: "Brainstorm ideas",
    prompt: "Give me 10 creative startup ideas combining AI and sustainability",
    color: "#f59e0b",
  },
  {
    icon: <Calculator size={18} />,
    title: "Solve a problem",
    prompt: "Explain recursion vs iteration with clear JavaScript examples",
    color: "#f43f5e",
  },
];

export default function WelcomeScreen() {
  const { sendMessage } = useChat();

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16 px-6 text-center">
      {/* Logo */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gem-400 via-accent-purple to-accent-teal flex items-center justify-center shadow-2xl">
          <Sparkles size={28} className="text-white" />
        </div>
      </div>

      {/* Title — uses solid CSS var color so it's always visible */}
      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
        <span
          style={{
            background: "linear-gradient(120deg, #4f8ef7, #8b5cf6, #14b8a6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            // Fallback for light mode where transparent text disappears on light bg
            filter: "var(--gradient-text-filter, none)",
          }}
        >
          Hello, I'm MindBot
        </span>
      </h1>

      <p
        className="text-sm max-w-xs leading-relaxed mb-10"
        style={{ color: "var(--text-muted)" }}
      >
        Powered by Google AI. Ask me anything — code, writing, analysis and
        more.
      </p>

      {/* Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => sendMessage(s.prompt)}
            className="flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer"
            style={{ background: `${s.color}0d`, borderColor: `${s.color}33` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${s.color}1a`;
              e.currentTarget.style.borderColor = `${s.color}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${s.color}0d`;
              e.currentTarget.style.borderColor = `${s.color}33`;
            }}
          >
            <div className="mt-0.5 flex-shrink-0" style={{ color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div
                className="text-[13px] font-medium"
                style={{ color: "var(--text)" }}
              >
                {s.title}
              </div>
              <div
                className="text-[12px] mt-0.5 leading-relaxed line-clamp-2"
                style={{ color: "var(--text-muted)" }}
              >
                {s.prompt}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
