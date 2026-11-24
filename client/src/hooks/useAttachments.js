import { useCallback, useRef, useState } from "react";
import { getApiErrorMessage } from "../utils/apiError.js";

export const MAX_FILES = 5;
const MAX_MB = 10;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

const extensionOf = (name) => name.slice(name.lastIndexOf(".")).toLowerCase();
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function deleteDocument(documentId) {
  // Best effort — an un-sent upload shouldn't linger in the database
  fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
    credentials: "include",
  }).catch(() => {});
}

// fetch() can't report upload progress, so use XMLHttpRequest.
// onSent fires when the bytes are uploaded; the server then still needs time
// to extract text and create embeddings (the "processing" state).
function postFile(file, { onProgress, onSent }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents/upload");
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.upload.onload = onSent;

    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(getApiErrorMessage(body, "Upload failed.")));
    };
    xhr.onerror = () =>
      reject(new Error("Network error. Please check your connection."));

    xhr.send(form);
  });
}

/**
 * Files attached to the message being written (like ChatGPT / Claude).
 * Each file uploads as soon as it's picked or dropped; the chat request later
 * sends only the ids of the files that finished.
 *
 * item: { localId, name, size, status: "uploading" | "processing" | "ready" | "failed",
 *         progress, documentId?, error? }
 */
export function useAttachments() {
  const [items, setItems] = useState([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  // Items removed while their upload was still running
  const removedRef = useRef(new Set());

  const patch = useCallback((localId, changes) => {
    setItems((prev) =>
      prev.map((i) => (i.localId === localId ? { ...i, ...changes } : i)),
    );
  }, []);

  const upload = useCallback(
    async (localId, file) => {
      try {
        const body = await postFile(file, {
          onProgress: (progress) => patch(localId, { progress }),
          onSent: () => patch(localId, { status: "processing", progress: 100 }),
        });

        const documentId = body.data?._id || body.data?.id;

        if (removedRef.current.has(localId)) {
          removedRef.current.delete(localId);
          if (documentId) deleteDocument(documentId);
          return;
        }

        patch(localId, { status: "ready", documentId });
      } catch (err) {
        removedRef.current.delete(localId);
        patch(localId, { status: "failed", error: err.message });
      }
    },
    [patch],
  );

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      let slots = MAX_FILES - itemsRef.current.length;
      const added = [];

      for (const file of files) {
        if (slots <= 0) break;
        slots -= 1;

        let error = "";
        if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
          error = "Only PDF, DOCX and TXT files are supported.";
        } else if (file.size > MAX_MB * 1024 * 1024) {
          error = `File is larger than ${MAX_MB}MB.`;
        }

        added.push({
          localId: newId(),
          name: file.name,
          size: file.size,
          status: error ? "failed" : "uploading",
          progress: 0,
          error,
          file,
        });
      }

      if (!added.length) return;

      setItems((prev) => [...prev, ...added.map(({ file, ...rest }) => rest)]);
      added.forEach(({ localId, file, status }) => {
        if (status === "uploading") upload(localId, file);
      });
    },
    [upload],
  );

  const remove = useCallback((localId) => {
    const item = itemsRef.current.find((i) => i.localId === localId);
    if (item?.status === "ready" && item.documentId) {
      deleteDocument(item.documentId);
    }
    if (item?.status === "uploading" || item?.status === "processing") {
      removedRef.current.add(localId);
    }
    setItems((prev) => prev.filter((i) => i.localId !== localId));
  }, []);

  // After a successful send the files now belong to the conversation
  const clear = useCallback(() => setItems([]), []);
  // If sending fails, put the files back so nothing is lost
  const restore = useCallback((snapshot) => setItems(snapshot), []);

  return {
    items,
    addFiles,
    remove,
    clear,
    restore,
    readyItems: items.filter((i) => i.status === "ready"),
    isUploading: items.some(
      (i) => i.status === "uploading" || i.status === "processing",
    ),
    isFull: items.length >= MAX_FILES,
  };
}
