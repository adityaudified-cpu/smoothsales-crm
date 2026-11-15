// Saved lead segments. Filters: { stages[], sources[], priorities[], city, assignedStaffId, unassigned, createdWithinDays }
// using backend enum values (Customer.LeadStage / LeadSource, priority HIGH|MEDIUM|LOW).
import { apiRequest, unwrapPage } from "./client";

export const segmentsApi = {
  list: () => apiRequest("/segments"),
  get: (id) => apiRequest(`/segments/${id}`),
  create: ({ name, description, filters }) => apiRequest("/segments", { method: "POST", body: { name, description, filters } }),
  update: (id, { name, description, filters }) => apiRequest(`/segments/${id}`, { method: "PUT", body: { name, description, filters } }),
  remove: (id) => apiRequest(`/segments/${id}`, { method: "DELETE" }),
  preview: (filters) => apiRequest("/segments/preview", { method: "POST", body: filters }).then((r) => r?.count ?? 0),
  leads: async (id, { page = 0, size = 50 } = {}) => unwrapPage(await apiRequest(`/segments/${id}/leads`, { query: { page, size } })),
};
