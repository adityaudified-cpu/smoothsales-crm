import { apiRequest } from "./client";

/**
 * Third-party Integrations API client
 * Interacts with backend /integrations and /webhooks endpoints
 */

export async function listIntegrations() {
  return apiRequest("/integrations");
}

export async function getIntegration(key) {
  return apiRequest(`/integrations/${key}`);
}

export async function saveIntegration(key, data) {
  return apiRequest(`/integrations/${key}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteIntegration(key) {
  return apiRequest(`/integrations/${key}`, {
    method: "DELETE",
  });
}

export async function testIntegration(key, payload = null) {
  return apiRequest(`/integrations/${key}/test`, {
    method: "POST",
    ...(payload ? { body: payload } : {}),
  });
}

export async function rotateWebhookKey(key) {
  return apiRequest(`/integrations/${key}/rotate-webhook-key`, {
    method: "POST",
  });
}

export async function simulateLead(source, payload) {
  return apiRequest("/integrations/simulate", {
    method: "POST",
    body: { source, payload },
  });
}

export async function listWebhookAudit() {
  return apiRequest("/integrations/audit/webhooks");
}

export async function reprocessWebhook(id) {
  return apiRequest(`/integrations/audit/webhooks/${id}/reprocess`, {
    method: "POST",
  });
}

export async function sendMetaCapiConversion(data) {
  return apiRequest("/integrations/conversions/meta", {
    method: "POST",
    body: data,
  });
}

export async function sendGoogleOciConversion(data) {
  return apiRequest("/integrations/conversions/google", {
    method: "POST",
    body: data,
  });
}

/**
 * Meta Lead Ads Admin API (Page & Form Asset Explorer)
 */
export const metaAdminApi = {
  listPages: () => apiRequest("/admin/meta/pages"),
  syncPages: () => apiRequest("/admin/meta/pages/sync", { method: "POST" }),
  syncPagesFromGraph: () => apiRequest("/admin/meta/pages/sync", { method: "POST" }),
  subscribePage: (pageId) => {
    if (!pageId || pageId === "[object Object]") {
      return Promise.reject(new Error("Invalid Facebook Page ID"));
    }
    return apiRequest(`/admin/meta/pages/${encodeURIComponent(pageId)}/subscribe`, { method: "POST" });
  },
  deletePage: (pageId) => {
    if (!pageId) return Promise.reject(new Error("Facebook Page ID required"));
    return apiRequest(`/admin/meta/pages/${encodeURIComponent(pageId)}`, { method: "DELETE" });
  },
  togglePageActive: (pageId, active) => {
    if (!pageId || pageId === "[object Object]") {
      return Promise.reject(new Error("Invalid Facebook Page ID"));
    }
    return apiRequest(`/admin/meta/pages/${encodeURIComponent(pageId)}/toggle-active?active=${active}`, { method: "PUT" });
  },
  listForms: (pageId) => {
    if (!pageId || pageId === "[object Object]") {
      return Promise.reject(new Error("Invalid Facebook Page ID"));
    }
    return apiRequest(`/admin/meta/pages/${encodeURIComponent(pageId)}/forms`);
  },
  toggleFormActive: (pageId, formId, active) => {
    if (!pageId || pageId === "[object Object]") {
      return Promise.reject(new Error("Invalid Facebook Page ID"));
    }
    return apiRequest(`/admin/meta/pages/${encodeURIComponent(pageId)}/forms/${encodeURIComponent(formId)}/toggle-active?active=${active}`, { method: "PUT" });
  },
  getDiagnostics: () => apiRequest("/admin/meta/diagnostics"),
  triggerBackfill: (pageId, since) => {
    const params = new URLSearchParams();
    if (pageId && pageId !== "[object Object]") params.append("pageId", pageId);
    if (since) params.append("since", since);
    return apiRequest(`/admin/meta/backfill?${params.toString()}`, { method: "POST" });
  },
  listAdAccounts: () => apiRequest("/admin/meta/ad-accounts"),
  deleteAdAccount: (adAccountId) => {
    if (!adAccountId) return Promise.reject(new Error("Ad Account ID required"));
    return apiRequest(`/admin/meta/ad-accounts/${encodeURIComponent(adAccountId)}`, { method: "DELETE" });
  },
  toggleAdAccountActive: (adAccountId, active) => {
    if (!adAccountId || adAccountId === "[object Object]") {
      return Promise.reject(new Error("Invalid Ad Account ID"));
    }
    return apiRequest(`/admin/meta/ad-accounts/${encodeURIComponent(adAccountId)}/toggle-active?active=${active}`, { method: "PUT" });
  },
  addAdAccount: (adAccountIdOrObj, name) => {
    let id = adAccountIdOrObj;
    let n = name;
    if (adAccountIdOrObj && typeof adAccountIdOrObj === "object") {
      id = adAccountIdOrObj.adAccountId || adAccountIdOrObj.id;
      n = adAccountIdOrObj.name || name;
    }
    if (!id || typeof id !== "string" || id.trim() === "[object Object]") {
      return Promise.reject(new Error("Please enter a valid numeric Meta Ad Account ID"));
    }
    const params = new URLSearchParams();
    params.append("adAccountId", id.trim());
    if (n) params.append("name", n.trim());
    return apiRequest(`/admin/meta/ad-accounts?${params.toString()}`, { method: "POST" });
  },
  addPageManual: (pageIdOrObj, pageName) => {
    let id = pageIdOrObj;
    let name = pageName;
    if (pageIdOrObj && typeof pageIdOrObj === "object") {
      id = pageIdOrObj.pageId || pageIdOrObj.id;
      name = pageIdOrObj.pageName || pageIdOrObj.name || pageName;
    }
    if (!id || typeof id !== "string" || id.trim() === "[object Object]") {
      return Promise.reject(new Error("Please enter a valid numeric Facebook Page ID"));
    }
    const params = new URLSearchParams();
    params.append("pageId", id.trim());
    if (name) params.append("pageName", name.trim());
    return apiRequest(`/admin/meta/pages/manual?${params.toString()}`, { method: "POST" });
  },
  requeueEvents: (status, since) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (since) params.append("since", since);
    return apiRequest(`/admin/meta/events/requeue?${params.toString()}`, { method: "POST" });
  },
};
