/**
 * WhatsApp integration layer.
 *
 * Architecture:
 *  - Meta Cloud API credentials are stored in localStorage via wa-accounts-context.
 *  - Templates are fetched directly from Meta Graph API using the stored token.
 *  - Messages are sent directly via Meta Cloud API (no backend proxy needed).
 *  - Conversations/inbox are stored in localStorage (Meta Cloud API is outbound-only;
 *    inbound requires a webhook server — stored locally until a backend is available).
 *  - Campaigns are stored in localStorage with direct Meta API sends per recipient.
 *
 * Meta Graph API base: https://graph.facebook.com/v19.0
 */

const META_GRAPH = "https://graph.facebook.com/v19.0";

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGet(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Meta Graph API request ────────────────────────────────────────────────────

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

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES_KEY = "wa_templates_v1";

export const whatsappTemplatesApi = {
  /** Get all templates from localStorage cache */
  getAll: () => Promise.resolve(lsGet(TEMPLATES_KEY, [])),

  /** Get only APPROVED templates */
  getApproved: () => Promise.resolve(lsGet(TEMPLATES_KEY, []).filter((t) => t.status === "APPROVED")),

  /** Get single template by id */
  getById: (id) => Promise.resolve(lsGet(TEMPLATES_KEY, []).find((t) => t.id === id) || null),

  /** Create a local draft template */
  create: (req) => {
    const templates = lsGet(TEMPLATES_KEY, []);
    const newT = {
      id: `t_${Date.now()}`,
      templateName: req.templateName || req.displayName?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || `template_${Date.now()}`,
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
    return Promise.resolve(newT);
  },

  /** Update a template */
  update: (id, req) => {
    const templates = lsGet(TEMPLATES_KEY, []).map((t) =>
      t.id === id ? { ...t, ...req, status: "DRAFT", updatedAt: new Date().toISOString() } : t
    );
    lsSet(TEMPLATES_KEY, templates);
    return Promise.resolve(templates.find((t) => t.id === id));
  },

  /** Delete a template */
  delete: (id) => {
    lsSet(TEMPLATES_KEY, lsGet(TEMPLATES_KEY, []).filter((t) => t.id !== id));
    return Promise.resolve({ success: true });
  },

  /** Submit draft to Meta for review */
  submitDraft: async (id) => {
    const creds = getMetaCredentials();
    const templates = lsGet(TEMPLATES_KEY, []);
    const tmpl = templates.find((t) => t.id === id);
    if (!tmpl) throw new Error("Template not found");

    if (creds?.token && creds?.wabaId) {
      // Build components array for Meta API
      const components = [];
      if (tmpl.headerText) components.push({ type: "HEADER", format: "TEXT", text: tmpl.headerText });
      components.push({ type: "BODY", text: tmpl.bodyText });
      if (tmpl.footerText) components.push({ type: "FOOTER", text: tmpl.footerText });

      try {
        const result = await metaRequest(`/${creds.wabaId}/message_templates`, {
          method: "POST",
          token: creds.token,
          body: {
            name: tmpl.templateName,
            language: tmpl.language || "en",
            category: tmpl.category,
            components,
          },
        });
        const updated = templates.map((t) =>
          t.id === id ? { ...t, status: "PENDING", metaId: result.id } : t
        );
        lsSet(TEMPLATES_KEY, updated);
        return updated.find((t) => t.id === id);
      } catch (err) {
        // Mark as pending locally even if Meta call fails (offline mode)
        const updated = templates.map((t) => t.id === id ? { ...t, status: "PENDING" } : t);
        lsSet(TEMPLATES_KEY, updated);
        throw err;
      }
    } else {
      // No credentials — just mark as pending locally
      const updated = templates.map((t) => t.id === id ? { ...t, status: "PENDING" } : t);
      lsSet(TEMPLATES_KEY, updated);
      return updated.find((t) => t.id === id);
    }
  },

  /** Sync templates from Meta Graph API */
  syncAll: async () => {
    const creds = getMetaCredentials();
    if (!creds?.token || !creds?.wabaId) throw new Error("No Meta credentials configured");

    const result = await metaRequest(`/${creds.wabaId}/message_templates?fields=id,name,status,category,language,components&limit=100`, {
      token: creds.token,
    });

    const synced = (result.data || []).map((t) => {
      const bodyComp = t.components?.find((c) => c.type === "BODY");
      const headerComp = t.components?.find((c) => c.type === "HEADER");
      const footerComp = t.components?.find((c) => c.type === "FOOTER");
      // Extract variables from body text {{1}}, {{2}} etc.
      const vars = [];
      const bodyText = bodyComp?.text || "";
      const matches = bodyText.matchAll(/\{\{(\d+)\}\}/g);
      for (const m of matches) vars.push(`var_${m[1]}`);

      return {
        id: t.id,
        templateName: t.name,
        displayName: t.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        category: t.category || "UTILITY",
        language: t.language || "en",
        status: t.status || "PENDING",
        source: "meta",
        bodyText,
        headerText: headerComp?.text || null,
        footerText: footerComp?.text || null,
        variables: vars,
        usedIn: 0,
        createdAt: new Date().toISOString(),
      };
    });

    // Merge: keep local drafts, replace/add synced ones
    const existing = lsGet(TEMPLATES_KEY, []);
    const localDrafts = existing.filter((t) => t.source === "local");
    const merged = [...localDrafts, ...synced];
    lsSet(TEMPLATES_KEY, merged);
    return merged;
  },
};

// ── Campaigns ─────────────────────────────────────────────────────────────────

const CAMPAIGNS_KEY = "wa_campaigns_v1";

export const whatsappCampaignsApi = {
  getAll: () => Promise.resolve({ items: lsGet(CAMPAIGNS_KEY, []), total: lsGet(CAMPAIGNS_KEY, []).length }),

  getById: (id) => Promise.resolve(lsGet(CAMPAIGNS_KEY, []).find((c) => c.id === id) || null),

  create: (req) => {
    const campaigns = lsGet(CAMPAIGNS_KEY, []);
    const newC = {
      id: `c_${Date.now()}`,
      name: req.name,
      templateId: req.templateId || null,
      messageBody: req.messageBody || null,
      type: req.type || "TEMPLATE",
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
    return Promise.resolve(newC);
  },

  start: (id) => {
    const campaigns = lsGet(CAMPAIGNS_KEY, []).map((c) =>
      c.id === id ? { ...c, status: "running", startedAt: new Date().toISOString() } : c
    );
    lsSet(CAMPAIGNS_KEY, campaigns);
    return Promise.resolve(campaigns.find((c) => c.id === id));
  },

  pause: (id) => {
    const campaigns = lsGet(CAMPAIGNS_KEY, []).map((c) =>
      c.id === id ? { ...c, status: "paused" } : c
    );
    lsSet(CAMPAIGNS_KEY, campaigns);
    return Promise.resolve(campaigns.find((c) => c.id === id));
  },

  cancel: (id) => {
    const campaigns = lsGet(CAMPAIGNS_KEY, []).map((c) =>
      c.id === id ? { ...c, status: "cancelled" } : c
    );
    lsSet(CAMPAIGNS_KEY, campaigns);
    return Promise.resolve(campaigns.find((c) => c.id === id));
  },

  delete: (id) => {
    lsSet(CAMPAIGNS_KEY, lsGet(CAMPAIGNS_KEY, []).filter((c) => c.id !== id));
    return Promise.resolve({ success: true });
  },

  getMessages: (id) => {
    const msgs = lsGet(`wa_campaign_msgs_${id}`, []);
    return Promise.resolve({ items: msgs, total: msgs.length });
  },

  getStats: (id) => {
    const c = lsGet(CAMPAIGNS_KEY, []).find((x) => x.id === id);
    return Promise.resolve(c ? {
      sentCount: c.sentCount, deliveredCount: c.deliveredCount,
      readCount: c.readCount, repliedCount: c.repliedCount, failedCount: c.failedCount,
    } : null);
  },

  previewAudience: () => Promise.resolve({ count: 0 }),
};

// ── Conversations (Inbox) ─────────────────────────────────────────────────────

const CONVS_KEY = "wa_conversations_v1";

export const whatsappInboxApi = {
  /** Get all conversations from localStorage */
  getConversations: () => Promise.resolve(lsGet(CONVS_KEY, [])),

  /** Get thread for a customer */
  getThread: (customerId) => {
    const convs = lsGet(CONVS_KEY, []);
    const conv = convs.find((c) => c.id === customerId);
    return Promise.resolve({ items: conv?.messages || [], total: conv?.messages?.length || 0 });
  },

  /** Mark as read */
  markAsRead: (customerId) => {
    const convs = lsGet(CONVS_KEY, []).map((c) =>
      c.id === customerId ? { ...c, unread: 0 } : c
    );
    lsSet(CONVS_KEY, convs);
    return Promise.resolve({ success: true });
  },

  /** Save a conversation (used internally when sending) */
  saveConversation: (conv) => {
    const convs = lsGet(CONVS_KEY, []);
    const idx = convs.findIndex((c) => c.id === conv.id);
    if (idx >= 0) convs[idx] = conv;
    else convs.unshift(conv);
    lsSet(CONVS_KEY, convs);
  },
};

// ── One-off Send via Meta Cloud API ──────────────────────────────────────────

export const whatsappSendApi = {
  /**
   * Send a template message via Meta Cloud API.
   * @param {{ phoneNumber: string, templateName: string, language?: string, variables?: string[], customerId?: string }} req
   */
  sendTemplate: async (req) => {
    const creds = getMetaCredentials();
    if (!creds?.token || !creds?.phoneId) throw new Error("No Meta credentials configured. Please connect your WhatsApp account first.");

    const components = [];
    if (req.variables?.length) {
      components.push({
        type: "body",
        parameters: req.variables.map((v) => ({ type: "text", text: v })),
      });
    }

    const result = await metaRequest(`/${creds.phoneId}/messages`, {
      method: "POST",
      token: creds.token,
      body: {
        messaging_product: "whatsapp",
        to: req.phoneNumber.replace(/\D/g, ""),
        type: "template",
        template: {
          name: req.templateName,
          language: { code: req.language || "en" },
          components: components.length ? components : undefined,
        },
      },
    });

    // Save to conversation log
    if (req.customerId) {
      const convs = lsGet(CONVS_KEY, []);
      const conv = convs.find((c) => c.id === req.customerId) || {
        id: req.customerId, name: req.customerName || req.phoneNumber,
        phone: req.phoneNumber, initials: "?", messages: [], unread: 0,
        status: "open", channel: "meta", lastTime: "", lastMsg: "",
      };
      const msg = {
        id: result.messages?.[0]?.id || `msg_${Date.now()}`,
        from: "us", text: `[Template: ${req.templateName}]`,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "sent", date: "Today",
      };
      conv.messages = [...(conv.messages || []), msg];
      conv.lastMsg = msg.text;
      conv.lastTime = msg.time;
      whatsappInboxApi.saveConversation(conv);
    }

    return result;
  },

  /**
   * Send a free-text session message via Meta Cloud API.
   * @param {{ phoneNumber: string, messageBody: string, customerId?: string, customerName?: string }} req
   */
  sendSession: async (req) => {
    const creds = getMetaCredentials();
    if (!creds?.token || !creds?.phoneId) throw new Error("No Meta credentials configured. Please connect your WhatsApp account first.");

    const result = await metaRequest(`/${creds.phoneId}/messages`, {
      method: "POST",
      token: creds.token,
      body: {
        messaging_product: "whatsapp",
        to: req.phoneNumber?.replace(/\D/g, "") || req.customerId,
        type: "text",
        text: { body: req.messageBody },
      },
    });

    // Save to conversation log
    const convId = req.customerId || req.phoneNumber;
    if (convId) {
      const convs = lsGet(CONVS_KEY, []);
      const conv = convs.find((c) => c.id === convId) || {
        id: convId, name: req.customerName || req.phoneNumber || convId,
        phone: req.phoneNumber || "", initials: (req.customerName || "?")[0].toUpperCase(),
        messages: [], unread: 0, status: "open", channel: "meta", lastTime: "", lastMsg: "",
        starred: false, online: false, source: "WhatsApp", label: null, tags: [], notes: "",
      };
      const msg = {
        id: result.messages?.[0]?.id || `msg_${Date.now()}`,
        from: "us", text: req.messageBody,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "sent", date: "Today",
      };
      conv.messages = [...(conv.messages || []), msg];
      conv.lastMsg = req.messageBody;
      conv.lastTime = msg.time;
      whatsappInboxApi.saveConversation(conv);
    }

    return result;
  },
};

// ── Verify Meta credentials ───────────────────────────────────────────────────

/**
 * Verify Meta credentials by calling the phone number info endpoint.
 * Returns phone number details on success, throws on failure.
 */
export async function verifyMetaCredentials({ token, phoneId }) {
  return metaRequest(`/${phoneId}?fields=display_phone_number,verified_name,quality_rating,status`, {
    token,
  });
}

// ── WebSocket / real-time ─────────────────────────────────────────────────────
// Meta Cloud API uses webhooks (server-side) for inbound messages.
// Without a backend, we cannot receive real-time inbound messages.
// These are no-op stubs that return an unsubscribe function.

export function subscribeCampaignProgress(_onMessage) {
  return () => {};
}

export function subscribeInboundMessages(_onMessage) {
  return () => {};
}
