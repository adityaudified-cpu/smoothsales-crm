import { apiRequest } from "./client";

export const followupsApi = {
  list: ({ bucket = "all", scope = "team", type = "ALL", search = "" } = {}) =>
    apiRequest("/followups", { query: { bucket, scope, type, search } }),
  create: (body) => apiRequest("/followups", { method: "POST", body }),
  reschedule: (id, { dueAt, notes }) =>
    apiRequest(`/followups/${id}/reschedule`, { method: "PATCH", body: { dueAt, notes } }),
  complete: (id, notes) =>
    apiRequest(`/followups/${id}/complete`, { method: "PATCH", body: notes ? { notes } : {} }),
};
