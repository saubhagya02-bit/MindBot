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
    icon: <Code2 size={18} className="text-gem-400" />,
    title: "Write code",
    prompt:
      "Write a Python script that fetches weather data from an API and displays it in the terminal",
    color:
      "from-gem-500/10 to-gem-400/5 hover:from-gem-500/20 hover:to-gem-400/10 border-gem-500/20 hover:border-gem-400/40",
  },
  {
    icon: <PenLine size={18} className="text-accent-purple" />,
    title: "Creative writing",
    prompt:
      "Write a short sci-fi story about an AI that discovers it is dreaming",
    color:
      "from-accent-purple/10 to-purple-400/5 hover:from-accent-purple/20 hover:to-purple-400/10 border-accent-purple/20 hover:border-accent-purple/40",
  },
  {
    icon: <Globe size={18} className="text-accent-teal" />,
    title: "Explain a concept",
    prompt:
      "Explain how the internet works in simple terms, from typing a URL to seeing the page",
    color:
      "from-accent-teal/10 to-teal-400/5 hover:from-accent-teal/20 hover:to-teal-400/10 border-accent-teal/20 hover:border-accent-teal/40",
  },
  {
    icon: <Lightbulb size={18} className="text-amber-400" />,
    title: "Brainstorm ideas",
    prompt:
      "Give me 10 creative startup ideas that combine AI and sustainability",
    color:
      "from-amber-500/10 to-amber-400/5 hover:from-amber-500/20 hover:to-amber-400/10 border-amber-500/20 hover:border-amber-400/40",
  },
  {
    icon: <Calculator size={18} className="text-rose-400" />,
    title: "Solve a problem",
    prompt:
      "Explain the difference between recursion and iteration with clear examples in JavaScript",
    color:
      "from-rose-500/10 to-rose-400/5 hover:from-rose-500/20 hover:to-rose-400/10 border-rose-500/20 hover:border-rose-400/40",
  },
];

export default function WelcomeScreen() {
  const { sendMessage } = useChat();

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16 px-6 text-center">
      {/* Logo */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gem-400 via-accent-purple to-accent-teal flex items-center justify-center shadow-2xl shadow-gem-500/20">
          <Sparkles size={28} className="text-white" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-gem-400/20 via-accent-purple/20 to-accent-teal/20 blur-lg z-10" />
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
        <span className="gemini-gradient">Hello, I'm MindBot</span>
      </h1>

      {/* Subtitle */}
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-10">
        Powered by Google AI. Ask me anything — I'm ready to help with code,
        writing, analysis, and more.
      </p>

      {/* Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => sendMessage(s.prompt)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border bg-gradient-to-br text-left transition-all duration-200 cursor-pointer group ${s.color}`}
          >
            <div className="mt-0.5 flex-shrink-0">{s.icon}</div>
            <div>
              <div className="text-[13px] font-medium text-slate-200 group-hover:text-white transition-colors">
                {s.title}
              </div>
              <div className="text-[12px] text-slate-500 group-hover:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                {s.prompt}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
