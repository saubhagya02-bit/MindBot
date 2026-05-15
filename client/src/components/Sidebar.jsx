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
  Settings,
  User,
  LogIn,
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
  const { user, setShowAuthPrompt, setShowAccountSettings } = useAuth();
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

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
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150`}
      style={{
        background:
          session.id === activeSessionId ? "var(--bg-600)" : "transparent",
        color:
          session.id === activeSessionId ? "var(--text)" : "var(--text-muted)",
      }}
      onClick={() => selectSession(session.id)}
      onMouseEnter={(e) => {
        if (session.id !== activeSessionId)
          e.currentTarget.style.background = "var(--bg-700)";
        setHoveredId(session.id);
      }}
      onMouseLeave={(e) => {
        if (session.id !== activeSessionId)
          e.currentTarget.style.background = "transparent";
        setHoveredId(null);
      }}
    >
      <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
      <span className="flex-1 text-[12.5px] truncate">{session.title}</span>
      {session.messageCount > 0 && hoveredId !== session.id && (
        <span
          className="text-[10px] flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        >
          {session.messageCount}
        </span>
      )}
      {(hoveredId === session.id || deletingId === session.id) && (
        <button
          onClick={(e) => handleDelete(e, session.id)}
          disabled={deletingId === session.id}
          className="flex-shrink-0 hover:text-red-400 transition-colors p-0.5 rounded"
          style={{ color: "var(--text-muted)" }}
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
    <div
      className="flex flex-col h-full w-64 border-r transition-colors duration-200"
      style={{ background: "var(--bg-900)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-display font-bold text-[15px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400">
          MindBot Chat
        </span>
      </div>

      {/* Search — logged in only */}
      {user && (
        <div className="px-3 pt-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
            style={{
              background: "var(--bg-800)",
              borderColor: "var(--border2)",
            }}
          >
            <Search
              size={13}
              style={{ color: "var(--text-muted)" }}
              className="flex-shrink-0"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-[12.5px] outline-none"
              style={{ color: "var(--text)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ color: "var(--text-muted)" }}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* New chat */}
      <div className="px-3 py-2.5">
        <button
          onClick={createSession}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-[12.5px] group"
          style={{
            borderColor: "var(--border2)",
            color: "var(--text-muted)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-800)";
            e.currentTarget.style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Plus size={13} />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {/* Guest — no history */}
        {!user && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
              style={{
                background: "var(--bg-800)",
                borderColor: "var(--border2)",
              }}
            >
              <LogIn size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Sign in to see history
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--border2)" }}
              >
                Your chats are saved across sessions
              </div>
            </div>
            <button
              onClick={() => setShowAuthPrompt(true)}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "var(--accent,#4f8ef7)22",
                border: "1px solid var(--accent,#4f8ef7)44",
                color: "var(--accent,#4f8ef7)",
              }}
            >
              Sign up free
            </button>
          </div>
        )}

        {user && loadingHistory && (
          <div
            className="flex items-center justify-center py-8 gap-2"
            style={{ color: "var(--text-muted)" }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Loading history...</span>
          </div>
        )}

        {user && !loadingHistory && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare
              size={20}
              className="mb-2"
              style={{ color: "var(--border2)" }}
            />
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              No conversations yet
            </div>
          </div>
        )}

        {user &&
          !loadingHistory &&
          sessions.length > 0 &&
          filtered.length === 0 && (
            <div
              className="text-center py-6 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              No results for "{search}"
            </div>
          )}

        {user &&
          !loadingHistory &&
          Object.entries(grouped).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label}>
                <div className="flex items-center gap-1.5 px-2 pt-3 pb-1.5">
                  {label === "Today" ? (
                    <Clock size={9} style={{ color: "var(--border2)" }} />
                  ) : (
                    <Calendar size={9} style={{ color: "var(--border2)" }} />
                  )}
                  <span
                    className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: "var(--border2)" }}
                  >
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
      <div
        className="px-3 py-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        {user ? (
          <button
            onClick={() => setShowAccountSettings(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all group"
            style={{
              background: "var(--bg-800)",
              borderColor: "var(--border2)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent,#4f8ef7)55")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border2)")
            }
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div
                className="text-[12.5px] font-semibold truncate"
                style={{ color: "var(--text)" }}
              >
                {user.name}
              </div>
              <div
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                {sessions.length} chats saved
              </div>
            </div>
            {/* Settings icon */}
            <Settings
              size={14}
              style={{ color: "var(--text-muted)" }}
              className="flex-shrink-0 group-hover:rotate-45 transition-transform duration-300"
            />
          </button>
        ) : (
          <button
            onClick={() => setShowAuthPrompt(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all"
            style={{
              background: "var(--accent,#4f8ef7)11",
              borderColor: "var(--accent,#4f8ef7)33",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--bg-800)",
                borderColor: "var(--border2)",
              }}
            >
              <User size={13} style={{ color: "var(--text-muted)" }} />
            </div>
            <div className="flex-1 text-left">
              <div
                className="text-[12px] font-medium"
                style={{ color: "var(--accent,#4f8ef7)" }}
              >
                Sign up free
              </div>
              <div
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                Save your chat history
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
