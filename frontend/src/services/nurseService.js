import { apiClient } from "./api";

// Matches backend/routes/nurseRoutes.js:
//   POST /api/nurses           (ADMIN only, own hospital - Phase 3.1: no longer public)
//        { name, email, password, phone, employeeId, hospitalId, departmentId,
//          qualification, shift }
//   GET  /api/nurses           (auth) ?hospitalId=&departmentId=&page=&limit=
//   GET  /api/nurses/me        (auth, NURSE)  -- Phase 3 addition
//   GET  /api/nurses/:id       (auth)
//   PUT/PATCH /api/nurses/:id  (NURSE self, or ADMIN)

export const nurseService = {
  register: (payload) => apiClient.post("/nurses", payload),
  list: (query) => apiClient.get("/nurses", query),
  getMyProfile: () => apiClient.get("/nurses/me"),
  get: (id) => apiClient.get(`/nurses/${id}`),
  update: (id, payload) => apiClient.patch(`/nurses/${id}`, payload),
};
