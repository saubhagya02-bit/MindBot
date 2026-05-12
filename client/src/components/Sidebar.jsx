import { useState, useMemo } from "react";
import {
  MessageSquare,
  Trash2,
  Sparkles,
  Clock,
  Calendar,
  Loader2,
  Search,
  X,
  Plus,
  LogOut,
  User,
} from "lucide-react";
import { useChat } from "../context/ChatContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

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
  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups["Today"].push(s);
    else if (d >= yesterday) groups["Yesterday"].push(s);
    else if (d >= lastWeek) groups["Last 7 days"].push(s);
    else if (d >= lastMonth) groups["Last 30 days"].push(s);
    else groups["Older"].push(s);
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
  const { user, logout } = useAuth();
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteSession(id);
    setDeletingId(null);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    return sessions.filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [sessions, search]);

  const grouped = groupSessionsByDate(filtered);

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
      {session.messageCount > 0 && hoveredId !== session.id && (
        <span className="text-[10px] text-slate-600 flex-shrink-0">
          {session.messageCount}
        </span>
      )}
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
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-base-700/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-display font-bold text-[15px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400">
          MindBot Chat
        </span>
      </div>

      {/* Search bar */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-800 border border-base-700 focus-within:border-gem-500/50 transition-colors">
          <Search size={13} className="text-slate-600 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-slate-300 text-[12.5px] outline-none placeholder-slate-600"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-slate-600 hover:text-slate-400"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* New chat button*/}
      <div className="px-3 pb-2">
        <button
          onClick={createSession}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-base-700 hover:border-gem-500/40 hover:bg-base-800 text-slate-500 hover:text-slate-300 transition-all text-[12.5px] group"
        >
          <Plus
            size={13}
            className="group-hover:text-gem-400 transition-colors"
          />
          New conversation
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {loadingHistory && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-600">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Loading history...</span>
          </div>
        )}

        {!loadingHistory && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare size={20} className="text-slate-700 mb-2" />
            <div className="text-slate-600 text-xs">No conversations yet</div>
            <div className="text-slate-700 text-xs mt-0.5">
              Start a new chat above
            </div>
          </div>
        )}

        {!loadingHistory && sessions.length > 0 && filtered.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-xs">
            No results for "{search}"
          </div>
        )}

        {!loadingHistory &&
          Object.entries(grouped).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label}>
                <div className="flex items-center gap-1.5 px-2 pt-3 pb-1.5">
                  {label === "Today" ? (
                    <Clock size={9} className="text-slate-700" />
                  ) : (
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

      {/* User account footer */}
      <div className="px-3 py-3 border-t border-base-700/50 relative">
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-base-800 border border-base-700 rounded-xl overflow-hidden shadow-xl z-50">
            <div className="px-3 py-3 border-b border-base-700">
              <div className="text-slate-200 text-[13px] font-medium truncate">
                {user?.name || "User"}
              </div>
              <div className="text-slate-500 text-[11px] truncate">
                {user?.email || ""}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 text-[13px] transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-base-800/60 border border-base-700/40 hover:border-base-600 hover:bg-base-800 transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || <User size={13} />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[12px] text-slate-300 font-medium truncate">
              {user?.name || "Account"}
            </div>
            <div className="text-[10px] text-slate-600 truncate">
              {sessions.length} chats · gemini-2.5-flash
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
