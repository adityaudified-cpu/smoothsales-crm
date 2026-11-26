import { apiRequest, unwrapPage } from "./client";

export const dealsApi = {
  list: async ({ page = 0, size = 200 } = {}) =>
    unwrapPage(await apiRequest("/deals", { query: { page, size } })),
  create: (body) => apiRequest("/deals", { method: "POST", body }),
  updateStage: (id, stage) =>
    apiRequest(`/deals/${id}/stage`, { method: "PATCH", body: { stage } }),
  update: (id, body) =>
    apiRequest(`/deals/${id}`, { method: "PATCH", body }),
  remove: (id) =>
    apiRequest(`/deals/${id}`, { method: "DELETE" }),
};
