import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2, AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "../utils/apiError.js";

const STATUS_LABEL = {
  processing: "Processing…",
  ready: "Ready",
  failed: "Failed",
};

export default function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents", { credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(getApiErrorMessage(body, "Could not load documents."));
      setDocuments(body.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, "Upload failed."));

      setDocuments((prev) => [body.data, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(body, "Delete failed."));
      setDocuments((prev) => prev.filter((d) => (d.id || d._id) !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Documents ({documents.length})
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60"
          style={{ borderColor: "var(--border2)", color: "var(--text)" }}
        >
          {uploading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Upload size={13} />
          )}
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        PDF, DOCX or TXT, up to 10MB. Uploaded documents are searched
        automatically when you ask a relevant question.
      </p>

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
      ) : documents.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No documents yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {documents.map((doc) => {
            const id = doc.id || doc._id;
            return (
              <div
                key={id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
                style={{
                  background: "var(--bg-800)",
                  borderColor: "var(--border2)",
                }}
              >
                <FileText
                  size={14}
                  style={{ color: "var(--text-muted)" }}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[12.5px] truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {doc.filename}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {STATUS_LABEL[doc.status] || doc.status}
                    {doc.status === "ready" && ` · ${doc.chunkCount} chunks`}
                    {doc.status === "failed" && doc.error
                      ? ` · ${doc.error}`
                      : ""}
                  </div>
                </div>
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
