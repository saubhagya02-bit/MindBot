import { useEffect, useState } from "react";
import { Brain, Trash2, Loader2, AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "../utils/apiError.js";

export default function MemoryManager() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/memory", { credentials: "include" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(getApiErrorMessage(body, "Could not load memory."));
        return body.data;
      })
      .then((data) => !cancelled && setMemories(data || []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, "Delete failed."));
      setMemories((prev) => prev.filter((m) => (m.id || m._id) !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        <Brain size={13} />
        What MindBot remembers ({memories.length})
      </div>

      {error && (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "#f87171" }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <Loader2 size={13} className="animate-spin" /> Loading…
        </div>
      ) : memories.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Nothing remembered yet. MindBot picks up durable facts (preferences,
          ongoing projects) as you chat.
        </p>
      ) : (
        <div className="space-y-1.5">
          {memories.map((m) => {
            const id = m.id || m._id;
            return (
              <div
                key={id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
                style={{
                  background: "var(--bg-800)",
                  borderColor: "var(--border2)",
                }}
              >
                <span
                  className="flex-1 text-[12.5px]"
                  style={{ color: "var(--text)" }}
                >
                  {m.fact}
                </span>
                <button
                  onClick={() => handleDelete(id)}
                  className="flex-shrink-0 hover:text-red-400 transition-colors p-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
