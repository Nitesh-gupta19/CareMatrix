import { apiClient } from "./api";

// Matches backend/routes/wardRoutes.js (router.use(protect)):
//   POST /api/wards           (ADMIN) { hospitalId, departmentId, name, type, floor }
//   GET  /api/wards           (auth) ?hospitalId= (required) &departmentId=&page=&limit=
//   GET  /api/wards/:id       (auth)
//   PUT/PATCH /api/wards/:id  (ADMIN, own hospital)

export const wardService = {
  create: (payload) => apiClient.post("/wards", payload),
  list: (query) => apiClient.get("/wards", query),
  get: (id) => apiClient.get(`/wards/${id}`),
  update: (id, payload) => apiClient.patch(`/wards/${id}`, payload),
};
