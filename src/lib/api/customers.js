// Leads / Customers endpoints of the SmoothSales backend. One function per endpoint.
import { apiRequest, unwrapPage } from "./client";

export const customersApi = {
  // GET /customers — role-scoped list (Spring pageable: page, size, sort="createdAt,desc")
  list: async ({ page = 0, size = 500, sort = "createdAt,desc" } = {}) => unwrapPage(await apiRequest("/customers", { query: { page, size, sort } })),
  // GET /customers/leads — campaign / Meta leads hub with filters
  listLeadsHub: async (filters = {}) => unwrapPage(await apiRequest("/customers/leads", { query: filters })),
  stats: () => apiRequest("/customers/leads/stats"),
  filterOptions: () => apiRequest("/customers/leads/filter-options"),
  search: async (q, { page = 0, size = 20 } = {}) => unwrapPage(await apiRequest("/customers/search", { query: { q, page, size } })),
  // POST /customers/filter — CustomerFilterRequest body
  filter: async (filter, { page = 0, size = 50 } = {}) => unwrapPage(await apiRequest("/customers/filter", { method: "POST", body: filter, query: { page, size } })),
  get: (id) => apiRequest(`/customers/${id}`),
  create: (customerRequest) => apiRequest("/customers", { method: "POST", body: customerRequest }),
  update: (id, customerRequest) => apiRequest(`/customers/${id}`, { method: "PUT", body: customerRequest }),
  patch: (id, customerPatch) => apiRequest(`/customers/${id}`, { method: "PATCH", body: customerPatch }),
  remove: (id) => apiRequest(`/customers/${id}`, { method: "DELETE" }),
  assign: (id, staffId) => apiRequest(`/customers/${id}/assign/${staffId}`, { method: "PATCH" }),
  bulkAssignSelected: (customerIds, staffId) => apiRequest("/customers/bulk-assign-selected", { method: "POST", body: { customerIds, staffId } }),
  bulkReassign: (fromStaffId, toStaffId) => apiRequest("/customers/bulk-assign", { method: "POST", body: { fromStaffId, toStaffId } }),
  shuffleToLead: (body) => apiRequest("/customers/shuffle-to-lead", { method: "POST", body }),
  // POST /customers/import (multipart) → BulkImportResult { totalRows, imported, skipped, failed, errors }
  importFile: (file, { userId, status } = {}) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest("/customers/import", { method: "POST", body: form, query: { userId, status } });
  },
  updateConsent: (id, consent) => apiRequest(`/customers/${id}/consent`, { method: "PATCH", body: consent }),
  timeline: async (id, { page = 0, size = 30 } = {}) => unwrapPage(await apiRequest(`/customers/${id}/timeline`, { query: { page, size } })),
  addNote: (id, content) => apiRequest(`/customers/${id}/notes`, { method: "POST", body: { content } }),
  attributions: (id) => apiRequest(`/customers/${id}/attributions`),
};

export const callsApi = {
  forCustomer: (customerId) => apiRequest(`/calls/customer/${customerId}`),
  // POST /calls/personal — SIM call logged by the rep: { customerId, durationSeconds, callType, notes }
  logPersonal: (body) => apiRequest("/calls/personal", { method: "POST", body }),
  // POST /calls/disposition — { callId, outcome, stageUpdate, notes, followUpDate, createReminder }
  disposition: (body) => apiRequest("/calls/disposition", { method: "POST", body }),
  pendingDisposition: () => apiRequest("/calls/pending-disposition"),
};

export const remindersApi = {
  // { customerId, title, notes, dueAt, type: CALL|WHATSAPP|EMAIL|SITE_VISIT|FOLLOW_UP|OTHER, assignedUserId }
  create: (body) => apiRequest("/reminders", { method: "POST", body }),
  mine: () => apiRequest("/reminders/my"),
  forCustomer: (customerId) => apiRequest(`/reminders/customer/${customerId}`),
  complete: (id) => apiRequest(`/reminders/${id}/complete`, { method: "PATCH" }),
  remove: (id) => apiRequest(`/reminders/${id}`, { method: "DELETE" }),
};

export const documentsApi = {
  forCustomer: (customerId) => apiRequest(`/documents/customer/${customerId}`),
  // DocumentRequest: { customerId, fileName, fileType, fileSizeBytes, storageKey, description, category }
  create: (body) => apiRequest("/documents", { method: "POST", body }),
};

export const usersApi = {
  assignable: () => apiRequest("/users/assignable"),
  team: () => apiRequest("/users/team"),
};
