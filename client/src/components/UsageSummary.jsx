import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getApiErrorMessage } from "../utils/apiError.js";

const formatNumber = (n) => new Intl.NumberFormat().format(n || 0);
const formatCost = (n) => `$${(n || 0).toFixed(4)}`;

function Stat({ label, value }) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5"
      style={{ background: "var(--bg-800)", borderColor: "var(--border2)" }}
    >
      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="text-sm font-semibold mt-0.5"
        style={{ color: "var(--text)" }}
      >
        {value}
      </div>
    </div>
  );
}

export default function UsageSummary() {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/usage", { credentials: "include" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(getApiErrorMessage(body, "Could not load usage."));
        return body.data;
      })
      .then((data) => !cancelled && setUsage(data))
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="text-xs" style={{ color: "#f87171" }}>
        {error}
      </p>
    );
  }

  if (!usage) {
    return (
      <div
        className="flex items-center gap-2"
        style={{ color: "var(--text-muted)" }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs">Loading usage…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Requests" value={formatNumber(usage.requests)} />
        <Stat label="Total tokens" value={formatNumber(usage.totalTokens)} />
        <Stat label="Estimated cost" value={formatCost(usage.estimatedCost)} />
        <Stat
          label="Avg latency"
          value={`${formatNumber(usage.avgLatencyMs)} ms`}
        />
      </div>

      {usage.byModel.length > 0 && (
        <div className="space-y-1">
          {usage.byModel.map((m) => (
            <div
              key={m.model}
              className="flex items-center justify-between text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{m.model}</span>
              <span>
                {formatNumber(m.requests)} req · {formatNumber(m.tokens)} tok ·{" "}
                {formatCost(m.estimatedCost)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
