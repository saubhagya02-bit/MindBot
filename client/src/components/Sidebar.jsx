import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";

export default function Sidebar() {
  const {
    sessions,
    activeSessionId,
    createSession,
    selectSession,
    deleteSession,
  } = useChat();

  const [hoveredId, setHoveredId] = useState(null);

  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.updatedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const olderSessions = sessions.filter((s) => {
    const d = new Date(s.updatedAt);
    const now = new Date();
    return d.toDateString() !== now.toDateString();
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteSession(id);
  };

  const SessionItem = ({ session }) => (
    <div
      className={`sidebar-item group relative ${session.id === activeSessionId ? "active" : ""}`}
      onClick={() => selectSession(session.id)}
      onMouseEnter={() => setHoveredId(session.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
      <span className="flex-1 truncate text-[13px]">{session.title}</span>
      {hoveredId === session.id && (
        <button
          onClick={(e) => handleDelete(e, session.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-0.5 rounded"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-64 bg-base-900 border-r border-base-700/50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-base-700/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-display font-semibold text-[15px] tracking-tight gemini-gradient">
          Gemini Chat
        </span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button
          onClick={createSession}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-base-600 hover:border-gem-500/50 hover:bg-base-800 text-slate-400 hover:text-slate-100 text-sm transition-all duration-150 group"
        >
          <Plus
            size={15}
            className="group-hover:text-gem-400 transition-colors"
          />
          <span className="font-medium text-[13px]">New conversation</span>
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-600 text-xs">No conversations yet</div>
            <div className="text-slate-700 text-xs mt-1">
              Start a new chat above
            </div>
          </div>
        ) : (
          <>
            {todaySessions.length > 0 && (
              <>
                <div className="px-2 pt-2 pb-1 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                  Today
                </div>
                {todaySessions.map((s) => (
                  <SessionItem key={s.id} session={s} />
                ))}
              </>
            )}
            {olderSessions.length > 0 && (
              <>
                <div className="px-2 pt-3 pb-1 text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                  Older
                </div>
                {olderSessions.map((s) => (
                  <SessionItem key={s.id} session={s} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-base-700/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-800/60 border border-base-700/40">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow flex-shrink-0" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              gemini-1.5-flash
            </div>
            <div className="text-[10px] text-slate-600">Google AI</div>
          </div>
          <ChevronRight size={12} className="ml-auto text-slate-700" />
        </div>
      </div>
    </div>
  );
}
