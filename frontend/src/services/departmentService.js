import { apiClient } from "./api";

// Matches backend/routes/departmentRoutes.js:
//   GET  /api/departments      (auth required - Phase 3.1: no longer public)  ?hospitalId= (required) &status=&page=&limit=
//   GET  /api/departments/:id  (auth required - Phase 3.1: no longer public)
//   POST /api/departments      (ADMIN)   { hospitalId, name, code, description, floor, phone }
//   PUT/PATCH /api/departments/:id (ADMIN, own hospital)

export const departmentService = {
  list: (query) => apiClient.get("/departments", query),
  get: (id) => apiClient.get(`/departments/${id}`),
  create: (payload) => apiClient.post("/departments", payload),
  update: (id, payload) => apiClient.patch(`/departments/${id}`, payload),
};
