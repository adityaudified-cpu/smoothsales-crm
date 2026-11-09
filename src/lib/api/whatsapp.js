/**
 * WhatsApp integration layer for SmoothSales CRM.
 * Connected to Spring Boot WhatsAppController (/api/whatsapp and /api/campaigns/whatsapp).
 */

import { apiRequest, unwrapPage, isApiMode } from "./client";

const META_GRAPH = "https://graph.facebook.com/v19.0";

// ── localStorage fallback helpers ─────────────────────────────────────────────

function lsGet(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const TEMPLATES_KEY = "wa_templates_v1";
const CAMPAIGNS_KEY = "wa_campaigns_v1";
const CONVS_KEY = "wa_conversations_v1";

// ── Meta Graph API direct request (used for client-side token verification) ──

async function metaRequest(path, { method = "GET", body, token } = {}) {
  const url = `${META_GRAPH}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Meta API error ${res.status}`);
  }
  return json;
}

// ── Get stored Meta credentials ───────────────────────────────────────────────

export function getMetaCredentials() {
  const accounts = lsGet("wa_accounts_v2", []);
  const meta = Array.isArray(accounts) ? accounts.find((a) => a.type === "meta") : null;
  if (!meta) return null;
  return { token: meta.token, phoneId: meta.phoneId, wabaId: meta.wabaId, label: meta.label };
}

// ── Templates API ─────────────────────────────────────────────────────────────

export const whatsappTemplatesApi = {
  /** Get all templates (loads from Spring Boot backend in API mode) */
  getAll: async () => {
    if (isApiMode()) {
      try {
        const res = await apiRequest("/whatsapp/templates");
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          lsSet(TEMPLATES_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn("Falling back to local templates cache", err);
      }
    }
    return lsGet(TEMPLATES_KEY, []);
  },

  /** Get only APPROVED templates */
  getApproved: async () => {
    if (isApiMode()) {
      try {
        const res = await apiRequest("/whatsapp/templates/approved");
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) return list;
      } catch (err) {
        console.warn("Falling back to local approved templates", err);
      }
    }
    const all = lsGet(TEMPLATES_KEY, []);
    return all.filter((t) => t.status === "APPROVED");
  },

  /** Get single template by id */
  getById: async (id) => {
    if (isApiMode()) {
      try {
        return await apiRequest(`/whatsapp/templates/${id}`);
      } catch {}
    }
    return lsGet(TEMPLATES_KEY, []).find((t) => t.id === id) || null;
  },

  /** Create a template (submits to backend & Meta) */
  create: async (req) => {
    if (isApiMode()) {
      return await apiRequest("/whatsapp/templates", {
        method: "POST",
        body: {
          templateName: req.templateName || req.displayName?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || `template_${Date.now()}`,
          displayName: req.displayName || req.templateName || "",
          language: req.language || "en_US",
          bodyText: req.bodyText || req.body || "",
          headerText: req.headerText || req.header || null,
          headerType: req.headerType || "NONE",
          footerText: req.footerText || req.footer || null,
          category: req.category || "UTILITY",
          variables: req.variables || [],
          variableSamples: req.variableSamples || [],
          buttons: req.buttons || [],
          saveDraft: Boolean(req.saveDraft),
        },
      });
    }
    const templates = lsGet(TEMPLATES_KEY, []);
    const newT = {
      id: `t_${Date.now()}`,
      templateName: req.templateName || `template_${Date.now()}`,
      displayName: req.displayName || req.templateName || "",
      category: req.category || "UTILITY",
      language: req.language || "en",
      status: "DRAFT",
      source: "local",
      bodyText: req.bodyText || req.body || "",
      headerText: req.headerText || req.header || null,
      footerText: req.footerText || req.footer || null,
      variables: req.variables || [],
      usedIn: 0,
      createdAt: new Date().toISOString(),
    };
    lsSet(TEMPLATES_KEY, [newT, ...templates]);
    return newT;
  },

  /** Update a template */
  update: async (id, req) => {
    if (isApiMode()) {
      return await apiRequest(`/whatsapp/templates/${id}`, { method: "PUT", body: req });
    }
    const templates = lsGet(TEMPLATES_KEY, []).map((t) =>
      t.id === id ? { ...t, ...req, status: "DRAFT", updatedAt: new Date().toISOString() } : t
    );
    lsSet(TEMPLATES_KEY, templates);
    return templates.find((t) => t.id === id);
  },

  /** Delete a template */
  delete: async (id) => {
    if (isApiMode()) {
      await apiRequest(`/whatsapp/templates/${id}`, { method: "DELETE" });
    }
    lsSet(TEMPLATES_KEY, lsGet(TEMPLATES_KEY, []).filter((t) => t.id !== id));
    return { success: true };
  },

  /** Submit draft template to Meta for approval */
  submit: async (id) => {
    if (isApiMode()) {
      return await apiRequest(`/whatsapp/templates/${id}/submit`, { method: "POST" });
    }
    return { success: true, status: "PENDING" };
  },

  /** Trigger live sync with Meta Graph API */
  syncMeta: async () => {
    if (isApiMode()) {
      const res = await apiRequest("/whatsapp/templates/sync", { method: "POST" });
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) lsSet(TEMPLATES_KEY, list);
      return list;
    }
    return lsGet(TEMPLATES_KEY, []);
  },

  /** Alias for syncMeta */
  syncAll: async () => {
    return whatsappTemplatesApi.syncMeta();
  },

  /** Sync single template status */
  syncSingle: async (id) => {
    if (isApiMode()) {
      return await apiRequest(`/whatsapp/templates/${id}/sync`, { method: "POST" });
    }
    return null;
  },
};

// ── Campaigns API ─────────────────────────────────────────────────────────────

export const whatsappCampaignsApi = {
  getAll: async (params = {}) => {
    if (isApiMode()) {
      try {
        const res = await apiRequest("/campaigns/whatsapp", { query: params });
        return unwrapPage(res);
      } catch (err) {
        console.warn("Failed to load campaigns from API", err);
      }
    }
    const local = lsGet(CAMPAIGNS_KEY, []);
    return { items: local, total: local.length };
  },

  getById: async (id) => {
    if (isApiMode()) {
      return await apiRequest(`/campaigns/whatsapp/${id}`);
    }
    return lsGet(CAMPAIGNS_KEY, []).find((c) => c.id === id) || null;
  },

  create: async (req) => {
    if (isApiMode()) {
      return await apiRequest("/campaigns/whatsapp", {
        method: "POST",
        body: {
          name: req.name,
          description: req.description || null,
          templateId: req.templateId || null,
          messageBody: req.messageBody || null,
          type: req.type || "OFFICIAL_API",
          scheduledAt: req.scheduledAt || null,
          segmentId: req.segmentId || null,
          filterCriteriaJson: req.filterCriteriaJson || null,
          customerIds: req.customerIds || null,
        },
      });
    }
    const campaigns = lsGet(CAMPAIGNS_KEY, []);
    const newC = {
      id: `c_${Date.now()}`,
      name: req.name,
      templateId: req.templateId || null,
      messageBody: req.messageBody || null,
      type: req.type || "OFFICIAL_API",
      status: req.scheduledAt ? "scheduled" : "draft",
      scheduledAt: req.scheduledAt || null,
      segmentId: req.segmentId || null,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliedCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
    };
    lsSet(CAMPAIGNS_KEY, [newC, ...campaigns]);
    return newC;
  },

  start: async (id) => {
    if (isApiMode()) {
      return await apiRequest(`/campaigns/whatsapp/${id}/start`, { method: "POST" });
    }
    const campaigns = lsGet(CAMPAIGNS_KEY, []).map((c) =>
      c.id === id ? { ...c, status: "running", startedAt: new Date().toISOString() } : c
    );
    lsSet(CAMPAIGNS_KEY, campaigns);
    return campaigns.find((c) => c.id === id);
  },

  pause: async (id) => {
    if (isApiMode()) {
      return await apiRequest(`/campaigns/whatsapp/${id}/pause`, { method: "PATCH" });
    }
    const campaigns = lsGet(CAMPAIGNS_KEY, []).map((c) =>
      c.id === id ? { ...c, status: "paused" } : c
    );
    lsSet(CAMPAIGNS_KEY, campaigns);
    return campaigns.find((c) => c.id === id);
  },

  cancel: async (id) => {
    if (isApiMode()) {
      return await apiRequest(`/campaigns/whatsapp/${id}/cancel`, { method: "PATCH" });
    }
    const campaigns = lsGet(CAMPAIGNS_KEY, []).map((c) =>
      c.id === id ? { ...c, status: "cancelled" } : c
    );
    lsSet(CAMPAIGNS_KEY, campaigns);
    return campaigns.find((c) => c.id === id);
  },

  delete: async (id) => {
    if (isApiMode()) {
      await apiRequest(`/campaigns/whatsapp/${id}`, { method: "DELETE" });
    }
    lsSet(CAMPAIGNS_KEY, lsGet(CAMPAIGNS_KEY, []).filter((c) => c.id !== id));
    return { success: true };
  },

  getMessages: async (id, params = {}) => {
    if (isApiMode()) {
      try {
        const res = await apiRequest(`/campaigns/whatsapp/${id}/messages`, { query: params });
        return unwrapPage(res);
      } catch (err) {
        console.warn("Failed to load campaign messages", err);
      }
    }
    const msgs = lsGet(`wa_campaign_msgs_${id}`, []);
    return { items: msgs, total: msgs.length };
  },

  getStats: async (id) => {
    if (isApiMode()) {
      try {
        return await apiRequest(`/campaigns/whatsapp/${id}/stats`);
      } catch (err) {
        console.warn("Failed to load campaign stats", err);
      }
    }
    const c = lsGet(CAMPAIGNS_KEY, []).find((x) => x.id === id);
    return c ? {
      sentCount: c.sentCount, deliveredCount: c.deliveredCount,
      readCount: c.readCount, repliedCount: c.repliedCount, failedCount: c.failedCount,
    } : null;
  },

  previewAudience: async (segmentId) => {
    if (isApiMode()) {
      try {
        return await apiRequest("/campaigns/whatsapp/audience-preview", { query: { segmentId } });
      } catch {}
    }
    return { count: 0 };
  },
};

// ── Conversations (Live Chat Inbox) ───────────────────────────────────────────

export const whatsappInboxApi = {
  /** Get all conversations from Spring Boot backend */
  getConversations: async () => {
    if (isApiMode()) {
      try {
        const res = await apiRequest("/whatsapp/conversations");
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        return list;
      } catch (err) {
        console.warn("Failed to load conversations from backend", err);
      }
    }
    return lsGet(CONVS_KEY, []);
  },

  /** Get full message thread for a customer */
  getThread: async (customerId) => {
    if (isApiMode() && customerId) {
      try {
        const res = await apiRequest(`/whatsapp/conversations/${customerId}`);
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        return { items: list, total: list.length };
      } catch (err) {
        console.warn("Failed to load conversation thread", err);
      }
    }
    const convs = lsGet(CONVS_KEY, []);
    const conv = convs.find((c) => c.id === customerId);
    return { items: conv?.messages || [], total: conv?.messages?.length || 0 };
  },

  /** Mark unread messages as read (sends Meta blue ticks) */
  markAsRead: async (customerId) => {
    if (isApiMode() && customerId) {
      try {
        await apiRequest(`/whatsapp/conversations/${customerId}/read`, { method: "POST" });
      } catch {}
    }
    const convs = lsGet(CONVS_KEY, []).map((c) =>
      c.id === customerId ? { ...c, unread: 0 } : c
    );
    lsSet(CONVS_KEY, convs);
    return { success: true };
  },

  saveConversation: (conv) => {
    const convs = lsGet(CONVS_KEY, []);
    const idx = convs.findIndex((c) => c.id === conv.id);
    if (idx >= 0) convs[idx] = conv;
    else convs.unshift(conv);
    lsSet(CONVS_KEY, convs);
  },
};

// ── Sending Messages via Spring Boot Backend ──────────────────────────────────

export const whatsappSendApi = {
  /**
   * Send a template message to a single customer via backend.
   */
  sendTemplate: async ({ customerId, templateId, variables = [] }) => {
    if (isApiMode()) {
      return await apiRequest("/whatsapp/send", {
        method: "POST",
        body: { customerId, templateId, variables },
      });
    }
    throw new Error("API mode required to send WhatsApp templates");
  },

  /**
   * Send a free-text session message via backend.
   */
  sendSession: async ({ customerId, messageBody, body }) => {
    const text = messageBody || body || "";
    if (isApiMode()) {
      return await apiRequest("/whatsapp/send-message", {
        method: "POST",
        body: { customerId, body: text, messageBody: text, messageType: "text" },
      });
    }
    throw new Error("API mode required to send WhatsApp messages");
  },
};

// ── Personal WhatsApp Log API ─────────────────────────────────────────────────

export const whatsappPersonalLogApi = {
  log: async (body) => {
    if (isApiMode()) {
      return await apiRequest("/whatsapp/personal-log", { method: "POST", body });
    }
    return { success: true };
  },
  forCustomer: async (customerId) => {
    if (isApiMode()) {
      return await apiRequest(`/whatsapp/personal-log/customer/${customerId}`);
    }
    return [];
  },
};

// ── Verify Meta credentials ───────────────────────────────────────────────────

export async function verifyMetaCredentials({ token, phoneId }) {
  return metaRequest(`/${phoneId}?fields=display_phone_number,verified_name,quality_rating,status`, {
    token,
  });
}

// ── WebSocket / real-time ─────────────────────────────────────────────────────

export function subscribeCampaignProgress(_onMessage) {
  return () => {};
}

export function subscribeInboundMessages(_onMessage) {
  return () => {};
}
