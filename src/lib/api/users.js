import { apiRequest, unwrapPage } from "./client";

export const usersApi = {
  // GET /users — paginated, role-scoped
  list: ({ page = 0, size = 100 } = {}) =>
    apiRequest("/users", { query: { page, size } }).then(unwrapPage),

  // GET /users/team — all active team members
  team: () => apiRequest("/users/team"),

  // GET /users/assignable
  assignable: () => apiRequest("/users/assignable"),

  // GET /users/{id}
  get: (id) => apiRequest(`/users/${id}`),

  // POST /users — create
  create: (body) => apiRequest("/users", { method: "POST", body }),

  // POST /users/invite — { name, email, phone, role, designation, reportsToId }
  invite: (body) => apiRequest("/users/invite", { method: "POST", body }),

  // PUT /users/{id} — { firstName, lastName, email, phone, role, reportsToId, twoFactorEnabled }
  update: (id, body) => apiRequest(`/users/${id}`, { method: "PUT", body }),

  // PATCH /users/{id}/status?active=true|false
  setStatus: (id, active) =>
    apiRequest(`/users/${id}/status`, { method: "PATCH", query: { active } }),

  // PATCH /users/{id}/2fa?enabled=true|false
  set2fa: (id, enabled) =>
    apiRequest(`/users/${id}/2fa`, { method: "PATCH", query: { enabled } }),

  // DELETE /users/{id}
  remove: (id) => apiRequest(`/users/${id}`, { method: "DELETE" }),
};

export const rolesApi = {
  // GET /roles
  list: () => apiRequest("/roles"),

  // GET /roles/{id}
  get: (id) => apiRequest(`/roles/${id}`),

  // POST /roles — { name, description, require2fa, permissions: Set<String> }
  create: (body) => apiRequest("/roles", { method: "POST", body }),

  // PUT /roles/{id}
  update: (id, body) => apiRequest(`/roles/${id}`, { method: "PUT", body }),

  // DELETE /roles/{id}
  remove: (id) => apiRequest(`/roles/${id}`, { method: "DELETE" }),
};

export const settingsApi = {
  // GET /settings/hierarchy — { hierarchyMode: "FLAT" | "HIERARCHICAL" }
  getHierarchy: () => apiRequest("/settings/hierarchy"),

  // PUT /settings/hierarchy — { hierarchyMode: "FLAT" | "HIERARCHICAL" }
  setHierarchy: (hierarchyMode) =>
    apiRequest("/settings/hierarchy", { method: "PUT", body: { hierarchyMode } }),

  // GET /settings/tenant — full tenant settings
  getTenant: () => apiRequest("/settings/tenant"),

  // PUT /settings/tenant
  updateTenant: (body) => apiRequest("/settings/tenant", { method: "PUT", body }),
};
