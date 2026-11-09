const DB_NAME = "smoothsales_crm_documents";
const STORE_NAME = "lead_documents";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Browser document storage is unavailable."));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open document storage."));
  });
}

async function runTransaction(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Document operation failed."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Document transaction failed.")); };
  });
}

export const listLeadDocuments = () => runTransaction("readonly", (store) => store.getAll());
export const addLeadDocument = (record) => runTransaction("readwrite", (store) => store.add(record));
export const deleteLeadDocument = (id) => runTransaction("readwrite", (store) => store.delete(id));

export function formatFileSize(size = 0) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadLeadDocument(document) {
  if (!document?.blob) return false;
  const url = URL.createObjectURL(document.blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function documentKind(document) {
  const type = document?.mimeType || "";
  const name = (document?.filename || "").toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return "image";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("audio/") || /\.(webm|mp3|wav|ogg|m4a)$/.test(name)) return "audio";
  if (type.startsWith("video/") || /\.(mp4|mov)$/.test(name)) return "video";
  if (type.startsWith("text/") || /\.(txt|csv|json|md)$/.test(name)) return "text";
  return "other";
}
