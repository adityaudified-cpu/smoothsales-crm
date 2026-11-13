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

export async function testIntegration(key) {
  return apiRequest(`/integrations/${key}/test`, {
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
