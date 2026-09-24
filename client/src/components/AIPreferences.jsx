import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getApiErrorMessage } from "../utils/apiError.js";

const TIER_INFO = {
  fast: { label: "Fast", hint: "Balanced speed and quality" },
  smart: { label: "Smart", hint: "Best answers, slower and pricier" },
  economy: { label: "Economy", hint: "Cheapest, good for simple questions" },
};

export default function AIPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ai/preferences", { credentials: "include" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(
            getApiErrorMessage(body, "Could not load AI settings."),
          );
        return body.data;
      })
      .then((data) => !cancelled && setPrefs(data))
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (changes) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ai/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(changes),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, "Could not save."));
      setPrefs(body.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) {
    return error ? (
      <p className="text-xs" style={{ color: "#f87171" }}>
        {error}
      </p>
    ) : (
      <div
        className="flex items-center gap-2"
        style={{ color: "var(--text-muted)" }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div
          className="text-xs font-medium mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Response mode
        </div>
        <div className="grid grid-cols-3 gap-2">
          {prefs.tiers.map((tier) => {
            const active = prefs.tier === tier;
            return (
              <button
                key={tier}
                disabled={saving}
                onClick={() => !active && save({ tier })}
                className="rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-60"
                style={{
                  background: active
                    ? "var(--accent,#4f8ef7)22"
                    : "var(--bg-800)",
                  borderColor: active
                    ? "var(--accent,#4f8ef7)"
                    : "var(--border2)",
                }}
              >
                <div
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {TIER_INFO[tier]?.label || tier}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {TIER_INFO[tier]?.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div
          className="text-xs font-medium mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          AI provider
        </div>
        <select
          value={prefs.provider}
          disabled={saving}
          onChange={(e) => save({ provider: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
          style={{
            background: "var(--bg-800)",
            borderColor: "var(--border2)",
            color: "var(--text)",
          }}
        >
          <option value="default">Default ({prefs.defaultProvider})</option>
          {prefs.providers.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.configured}>
              {p.label}
              {p.configured ? "" : " (not configured)"}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}
