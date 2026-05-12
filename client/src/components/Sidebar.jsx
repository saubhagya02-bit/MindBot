import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";

function groupSessionsByDate(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const groups = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    "Last 30 days": [],
    Older: [],
  };

  for (const session of sessions) {
    const date = new Date(session.updatedAt);
    date.setHours(0, 0, 0, 0);

    if (date >= today) groups["Today"].push(session);
    else if (date >= yesterday) groups["Yesterday"].push(session);
    else if (date >= lastWeek) groups["Last 7 days"].push(session);
    else if (date >= lastMonth) groups["Last 30 days"].push(session);
    else groups["Older"].push(session);
  }

  return groups;
}

export default function Sidebar() {
  const {
    sessions,
    activeSessionId,
    loadingHistory,
    createSession,
    selectSession,
    deleteSession,
  } = useChat();

  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteSession(id);
    setDeletingId(null);
  };

  const grouped = groupSessionsByDate(sessions);
  const hasAnySessions = sessions.length > 0;

  const SessionItem = ({ session }) => (
    <div
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
        session.id === activeSessionId
          ? "bg-base-600 text-slate-100"
          : "text-slate-400 hover:bg-base-700 hover:text-slate-200"
      }`}
      onClick={() => selectSession(session.id)}
      onMouseEnter={() => setHoveredId(session.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
      <span className="flex-1 text-[12.5px] truncate">{session.title}</span>

      {/* Message count badge */}
      {session.messageCount > 0 && hoveredId !== session.id && (
        <span className="text-[10px] text-slate-600 flex-shrink-0">
          {session.messageCount}
        </span>
      )}

      {/* Delete button */}
      {(hoveredId === session.id || deletingId === session.id) && (
        <button
          onClick={(e) => handleDelete(e, session.id)}
          disabled={deletingId === session.id}
          className="flex-shrink-0 text-slate-600 hover:text-red-400 transition-colors p-0.5 rounded"
        >
          {deletingId === session.id ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
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
          MindBot Chat
        </span>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          onClick={createSession}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-base-600 hover:border-gem-500/50 hover:bg-base-800 text-slate-400 hover:text-slate-100 transition-all duration-150 group"
        >
          <Plus
            size={15}
            className="group-hover:text-gem-400 transition-colors"
          />
          <span className="font-medium text-[13px]">New conversation</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {/* Loading state */}
        {loadingHistory && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-600">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Loading history...</span>
          </div>
        )}

        {/* Empty state */}
        {!loadingHistory && !hasAnySessions && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-base-800 border border-base-700 flex items-center justify-center mb-3">
              <MessageSquare size={16} className="text-slate-600" />
            </div>
            <div className="text-slate-500 text-xs font-medium">
              No conversations yet
            </div>
            <div className="text-slate-700 text-xs mt-1">
              Start a new chat above
            </div>
          </div>
        )}

        {!loadingHistory &&
          Object.entries(grouped).map(([label, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={label}>
                <div className="flex items-center gap-1.5 px-2 pt-3 pb-1.5">
                  {label === "Today" && (
                    <Clock size={9} className="text-slate-700" />
                  )}
                  {label !== "Today" && (
                    <Calendar size={9} className="text-slate-700" />
                  )}
                  <span className="text-[10px] font-medium text-slate-700 uppercase tracking-widest">
                    {label}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {items.map((s) => (
                    <SessionItem key={s.id} session={s} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-base-700/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-800/60 border border-base-700/40">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-slate-400 font-medium">
              gemini-2.5-flash
            </div>
            <div className="text-[10px] text-slate-600">
              Google AI · {sessions.length} chats saved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
