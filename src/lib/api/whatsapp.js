/**
 * WhatsApp API layer for SmoothSales CRM (Spring Boot: /whatsapp/**, /campaigns/whatsapp/**).
 * No local fallbacks: every call hits the backend, errors surface to the caller.
 */

import { apiRequest, apiBlob, apiBaseUrl, getAccessToken, unwrapPage } from "./client";

const list = (res) => (Array.isArray(res) ? res : res?.content || res?.items || []);

// ── Numbers (WhatsApp accounts) ──────────────────────────────────────────────

export const whatsappAccountsApi = {
  list: async () => list(await apiRequest("/whatsapp/accounts")),
  connect: ({ phoneNumberId, wabaId, accessToken, label }) =>
    apiRequest("/whatsapp/accounts", { method: "POST", body: { phoneNumberId, wabaId, accessToken, label } }),
  signupConfig: () => apiRequest("/whatsapp/accounts/embedded-signup/config"),
  completeSignup: ({ code, phoneNumberId, wabaId, coexistence, label }) =>
    apiRequest("/whatsapp/accounts/embedded-signup", { method: "POST", body: { code, phoneNumberId, wabaId, coexistence, label } }),
  verify: (id) => apiRequest(`/whatsapp/accounts/${id}/verify`, { method: "POST" }),
  rename: (id, label) => apiRequest(`/whatsapp/accounts/${id}`, { method: "PATCH", body: { label } }),
  updateToken: (id, accessToken) => apiRequest(`/whatsapp/accounts/${id}/token`, { method: "PUT", body: { accessToken } }),
  makeDefault: (id) => apiRequest(`/whatsapp/accounts/${id}/default`, { method: "POST" }),
  disconnect: (id) => apiRequest(`/whatsapp/accounts/${id}`, { method: "DELETE" }),
};

/** Workspace Meta app credentials (admins). Blank appSecret / verifyToken keeps the stored one. */
export const whatsappAppSettingsApi = {
  get: () => apiRequest("/whatsapp/app-settings"),
  save: ({ appId, appSecret, signupConfigId, verifyToken }) =>
    apiRequest("/whatsapp/app-settings", { method: "PUT", body: { appId, appSecret, signupConfigId, verifyToken } }),
};

// ── Templates ────────────────────────────────────────────────────────────────

export const whatsappTemplatesApi = {
  getAll: async (accountId) => list(await apiRequest("/whatsapp/templates", { query: { accountId } })),
  getApproved: async (accountId) => list(await apiRequest("/whatsapp/templates/approved", { query: { accountId } })),
  getById: (id) => apiRequest(`/whatsapp/templates/${id}`),
  create: (body) => apiRequest("/whatsapp/templates", { method: "POST", body }),
  update: (id, body) => apiRequest(`/whatsapp/templates/${id}`, { method: "PUT", body }),
  delete: (id) => apiRequest(`/whatsapp/templates/${id}`, { method: "DELETE" }),
  submit: (id) => apiRequest(`/whatsapp/templates/${id}/submit`, { method: "POST" }),
  syncAll: async () => list(await apiRequest("/whatsapp/templates/sync", { method: "POST" })),
  syncOne: (id) => apiRequest(`/whatsapp/templates/${id}/sync`, { method: "POST" }),
  /** Uploads the sample file Meta needs for an image/video/document header → { handle }. */
  uploadHeaderSample: (file, accountId) => {
    const form = new FormData();
    form.append("file", file);
    if (accountId) form.append("accountId", accountId);
    return apiRequest("/whatsapp/templates/header-sample", { method: "POST", body: form });
  },
};

// ── Inbox ────────────────────────────────────────────────────────────────────

export const whatsappInboxApi = {
  getConversations: async () => list(await apiRequest("/whatsapp/conversations")),
  /** → { items (oldest first), hasMore, contact } */
  getThread: (customerId, { before, size = 50 } = {}) =>
    apiRequest(`/whatsapp/conversations/${customerId}`, { query: { before, size } }),
  getContact: (customerId) => apiRequest(`/whatsapp/conversations/${customerId}/contact`),
  markAsRead: (customerId) => apiRequest(`/whatsapp/conversations/${customerId}/read`, { method: "POST" }),
  setLead: (customerId, lead) => apiRequest(`/whatsapp/conversations/${customerId}/lead`, { method: "PATCH", body: { lead } }),
  assign: (customerId, userId) => apiRequest(`/whatsapp/conversations/${customerId}/assign`, { method: "PATCH", body: { userId } }),
  saveNotes: (customerId, notes) => apiRequest(`/whatsapp/conversations/${customerId}/notes`, { method: "PATCH", body: { notes } }),
  setStage: (customerId, stage) => apiRequest(`/whatsapp/conversations/${customerId}/stage`, { method: "PATCH", body: { stage } }),
  settings: () => apiRequest("/whatsapp/settings"),
  updateSettings: (body) => apiRequest("/whatsapp/settings", { method: "PUT", body }),
  /** Attachment of a message as an object URL (caller revokes it). */
  mediaUrl: async (messageId, signal) => URL.createObjectURL(await apiBlob(`/whatsapp/media/${messageId}`, { signal })),
};

// ── Sending ──────────────────────────────────────────────────────────────────

export const whatsappSendApi = {
  sendTemplate: ({ customerId, phone, name, templateId, variables = [], headerVariable, headerMedia, buttonVariables, accountId }) =>
    apiRequest("/whatsapp/send", {
      method: "POST",
      body: { customerId, phone, name, templateId, variables, headerVariable, headerMedia, buttonVariables, accountId },
    }),
  sendText: ({ customerId, phone, name, body, accountId }) =>
    apiRequest("/whatsapp/send-message", { method: "POST", body: { customerId, phone, name, body, accountId } }),
  /** Uploads a file to Meta from a number → { mediaId } (template header media). */
  uploadMedia: (file, accountId) => {
    const form = new FormData();
    form.append("file", file);
    if (accountId) form.append("accountId", accountId);
    return apiRequest("/whatsapp/media/upload", { method: "POST", body: form });
  },
  sendMedia: ({ file, customerId, phone, caption, accountId }) => {
    const form = new FormData();
    form.append("file", file);
    if (customerId) form.append("customerId", customerId);
    if (phone) form.append("phone", phone);
    if (caption) form.append("caption", caption);
    if (accountId) form.append("accountId", accountId);
    return apiRequest("/whatsapp/send-media", { method: "POST", body: form });
  },
};

// ── Campaigns ────────────────────────────────────────────────────────────────

export const whatsappCampaignsApi = {
  getAll: async (params = {}) => unwrapPage(await apiRequest("/campaigns/whatsapp", { query: params })),
  getById: (id) => apiRequest(`/campaigns/whatsapp/${id}`),
  create: (body) => apiRequest("/campaigns/whatsapp", { method: "POST", body }),
  previewAudience: (body) => apiRequest("/campaigns/whatsapp/audience-preview", { method: "POST", body }),
  start: (id) => apiRequest(`/campaigns/whatsapp/${id}/start`, { method: "POST" }),
  pause: (id) => apiRequest(`/campaigns/whatsapp/${id}/pause`, { method: "PATCH" }),
  cancel: (id) => apiRequest(`/campaigns/whatsapp/${id}/cancel`, { method: "PATCH" }),
  duplicate: (id) => apiRequest(`/campaigns/whatsapp/${id}/duplicate`, { method: "POST" }),
  delete: (id) => apiRequest(`/campaigns/whatsapp/${id}`, { method: "DELETE" }),
  getMessages: async (id, params = {}) => unwrapPage(await apiRequest(`/campaigns/whatsapp/${id}/messages`, { query: params })),
  getStats: (id) => apiRequest(`/campaigns/whatsapp/${id}/stats`),
};

// ── Personal WhatsApp log (agent records a chat from their own phone) ───────

export const whatsappPersonalLogApi = {
  log: (body) => apiRequest("/whatsapp/personal-log", { method: "POST", body }),
  forCustomer: (customerId) => apiRequest(`/whatsapp/personal-log/customer/${customerId}`),
};

// ── Real-time (STOMP over SockJS, one shared connection per tab) ────────────

/** Workspace id from the access token's `tid` claim. */
function tenantIdFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.tid || payload.tenantId || payload.tenant_id || null;
  } catch {
    return null;
  }
}

let shared = null; // { client, tenantId, listeners: Map<topic, Set<fn>>, subs: Map<topic, sub>, statusFns: Set<fn>, connected }

function ensureClient() {
  if (typeof window === "undefined") return null;
  if (shared) return shared;
  const tenantId = tenantIdFromToken();
  shared = { client: null, tenantId, listeners: new Map(), subs: new Map(), statusFns: new Set(), connected: false };
  const state = shared;
  Promise.all([import("@stomp/stompjs"), import("sockjs-client")]).then(([{ Client }, sock]) => {
    const SockJS = sock.default || sock;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl()}/ws`),
      beforeConnect: () => {
        const token = getAccessToken();
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
      debug: () => {},
      onConnect: () => {
        state.connected = true;
        state.subs.clear();
        for (const topic of state.listeners.keys()) subscribeTopic(topic);
        state.statusFns.forEach((fn) => fn(true));
      },
      onWebSocketClose: () => {
        state.connected = false;
        state.statusFns.forEach((fn) => fn(false));
      },
      onStompError: (frame) => console.warn("[WS]", frame.headers?.message || "STOMP error"),
    });
    state.client = client;
    client.activate();
  }).catch((e) => console.warn("[WS] realtime unavailable:", e));
  return state;
}

function subscribeTopic(topic) {
  const state = shared;
  if (!state?.client?.connected || state.subs.has(topic)) return;
  const sub = state.client.subscribe(topic, (frame) => {
    let body;
    try { body = JSON.parse(frame.body); } catch { return; }
    state.listeners.get(topic)?.forEach((fn) => fn(body));
  });
  state.subs.set(topic, sub);
}

/** Subscribe to a tenant topic name, e.g. "whatsapp.conversations". Returns unsubscribe. */
function onTenantTopic(name, fn) {
  const state = ensureClient();
  if (!state || !state.tenantId) return () => {};
  const topic = `/topic/t/${state.tenantId}/${name}`;
  if (!state.listeners.has(topic)) state.listeners.set(topic, new Set());
  state.listeners.get(topic).add(fn);
  subscribeTopic(topic);
  return () => {
    const set = state.listeners.get(topic);
    set?.delete(fn);
    if (set && set.size === 0) {
      state.listeners.delete(topic);
      try { state.subs.get(topic)?.unsubscribe(); } catch {}
      state.subs.delete(topic);
    }
  };
}

/** Connection state of the shared socket. Returns unsubscribe. */
export function onRealtimeStatus(fn) {
  const state = ensureClient();
  if (!state) return () => {};
  state.statusFns.add(fn);
  fn(state.connected);
  return () => state.statusFns.delete(fn);
}

/** Every inbox event: new/updated messages ({type:"message"}) and contact changes ({type:"conversation"}). */
export function subscribeInboundMessages(onEvent) {
  return onTenantTopic("whatsapp.conversations", onEvent);
}

/** Live campaign counters. onProgress receives { campaignId, status, sentCount, ... }. */
export function subscribeCampaignProgress(onProgress) {
  return onTenantTopic("campaign.progress", onProgress);
}

/** Meta template approval / rejection / quality changes (full template object). */
export function subscribeTemplateStatus(onUpdate) {
  return onTenantTopic("whatsapp.templates", onUpdate);
}

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Highest {{n}} in a text. */
export function countVariables(text) {
  let max = 0;
  for (const m of String(text || "").matchAll(/\{\{(\d+)\}\}/g)) max = Math.max(max, Number(m[1]));
  return max;
}

/** Meta WhatsApp Manager link for a WABA's templates. */
export function templateManagerUrl(wabaId) {
  return wabaId
    ? `https://business.facebook.com/latest/whatsapp_manager/message_templates?asset_id=${wabaId}`
    : "https://business.facebook.com/latest/whatsapp_manager/message_templates";
}
