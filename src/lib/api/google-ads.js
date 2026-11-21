import { apiRequest } from "./client";

/**
 * Google Ads Lead Form Integration Client
 * Talks to backend endpoints at /api/integrations/google-ads
 */

export async function listGoogleAdsIntegrations() {
  return apiRequest("/integrations/google-ads");
}

export async function getGoogleAdsIntegration(id) {
  return apiRequest(`/integrations/google-ads/${id}`);
}

export async function createGoogleAdsIntegration(data) {
  return apiRequest("/integrations/google-ads", {
    method: "POST",
    body: data,
  });
}

export async function updateGoogleAdsIntegration(id, data) {
  return apiRequest(`/integrations/google-ads/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function regenerateGoogleAdsKey(id) {
  return apiRequest(`/integrations/google-ads/${id}/regenerate-key`, {
    method: "POST",
  });
}

export async function deleteGoogleAdsIntegration(id) {
  return apiRequest(`/integrations/google-ads/${id}`, {
    method: "DELETE",
  });
}

export async function getGoogleAdsEvents(id, { status, page = 0, size = 20 } = {}) {
  return apiRequest(`/integrations/google-ads/${id}/events`, {
    query: {
      ...(status && status !== "ALL" ? { status } : {}),
      page,
      size,
    },
  });
}

export async function reprocessGoogleAdsEvent(id, eventId) {
  return apiRequest(`/integrations/google-ads/${id}/events/${eventId}/reprocess`, {
    method: "POST",
  });
}

export async function getGoogleAdsStats(id) {
  return apiRequest(`/integrations/google-ads/${id}/stats`);
}

export async function getGoogleAdsMappings(id) {
  return apiRequest(`/integrations/google-ads/${id}/mappings`);
}

export async function saveGoogleAdsMappings(id, mappings) {
  return apiRequest(`/integrations/google-ads/${id}/mappings`, {
    method: "PUT",
    body: mappings,
  });
}
