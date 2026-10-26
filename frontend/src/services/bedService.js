import { apiClient } from "./api";

// Matches backend/routes/bedRoutes.js (router.use(protect)):
//   POST  /api/beds          (ADMIN) { wardId, bedNumber }
//   GET   /api/beds          (auth) ?wardId= (required) &status=&page=&limit=
//   GET   /api/beds/:id      (auth)
//   PATCH /api/beds/:id      (ADMIN) { status } - status can only be
//         'available' | 'maintenance' | 'reserved' here; 'occupied' is only
//         ever set by the backend as a side effect of creating an admission.

export const bedService = {
  create: (payload) => apiClient.post("/beds", payload),
  list: (query) => apiClient.get("/beds", query),
  get: (id) => apiClient.get(`/beds/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/beds/${id}`, { status }),
};
