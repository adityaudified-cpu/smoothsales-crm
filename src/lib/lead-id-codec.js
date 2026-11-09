// Obfuscates lead IDs in URLs so raw database IDs are not exposed.
// Uses base64url encoding with a simple XOR scramble — lightweight, reversible, no crypto dependency.

const SALT = "ss_crm_v1"; // change to invalidate all existing URLs

function xorBytes(str) {
  const key = SALT;
  return Array.from(str)
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join("");
}

function toBase64Url(str) {
  if (typeof btoa !== "undefined") {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
  return Buffer.from(str, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (str.length % 4)) % 4);
  if (typeof atob !== "undefined") return atob(padded);
  return Buffer.from(padded, "base64").toString("binary");
}

/** Encode a lead ID to a URL-safe opaque token */
export function encodeLeadId(id) {
  if (!id) return "";
  try {
    return toBase64Url(xorBytes(String(id)));
  } catch {
    return String(id);
  }
}

/** Decode a URL token back to the original lead ID */
export function decodeLeadId(token) {
  if (!token) return "";
  // If it looks like a raw ID (not base64url), return as-is for backward compat
  if (/^[a-z]+_\d+/.test(token) || /^\d+$/.test(token)) return token;
  try {
    return xorBytes(fromBase64Url(token));
  } catch {
    return token;
  }
}
