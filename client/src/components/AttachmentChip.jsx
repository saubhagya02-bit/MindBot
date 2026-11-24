import { FileText, Loader2, X, AlertCircle } from "lucide-react";

const TYPE_COLORS = {
  PDF: "#ef4444",
  DOCX: "#3b82f6",
  TXT: "#94a3b8",
};

const extensionOf = (name = "") =>
  name.includes(".") ? name.split(".").pop().toUpperCase() : "FILE";

export const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// One file card — used above the input (with progress and a remove button)
// and inside sent messages (finished state, no remove button).
export default function AttachmentChip({
  name,
  status = "ready", // "uploading" | "processing" | "ready" | "failed"
  error = "",
  size,
  progress = 0,
  onRemove,
}) {
  const ext = extensionOf(name);
  const failed = status === "failed";
  const busy = status === "uploading" || status === "processing";
  const accent = failed ? "#ef4444" : TYPE_COLORS[ext] || "#94a3b8";

  const subtitle = failed
    ? error || "Upload failed"
    : status === "uploading"
      ? `Uploading ${progress}%`
      : status === "processing"
        ? "Processing…"
        : [ext, formatSize(size)].filter(Boolean).join(" · ");

  return (
    <div
      title={failed ? error : name}
      className="relative overflow-hidden flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-xl border w-[230px]"
      style={{
        background: "var(--bg-700)",
        borderColor: failed ? "rgba(239,68,68,0.45)" : "var(--border2)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}22`, color: accent }}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : failed ? (
          <AlertCircle size={16} />
        ) : (
          <FileText size={16} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="text-[12.5px] font-medium leading-tight truncate"
          style={{ color: "var(--text)" }}
        >
          {name}
        </div>
        <div
          className="text-[10.5px] leading-tight mt-0.5 truncate"
          style={{ color: failed ? "#f87171" : "var(--text-muted)" }}
        >
          {subtitle}
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="flex-shrink-0 p-1 rounded-md hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={13} />
        </button>
      )}

      {status === "uploading" && (
        <div
          className="absolute bottom-0 left-0 h-[2px] transition-all duration-150"
          style={{ width: `${progress}%`, background: "var(--accent,#4f8ef7)" }}
        />
      )}
    </div>
  );
}
