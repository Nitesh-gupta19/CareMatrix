import { apiClient } from "./api";

// Matches backend/routes/hospitalRoutes.js:
//   POST   /api/hospitals/register  (public) { name, registrationNumber, address, city,
//                                               state, pincode, phone, email, website,
//                                               admin: { name, email, password, phone } }
//   GET    /api/hospitals           (public) ?search=&page=&limit=
//   GET    /api/hospitals/:id       (public)
//   PUT/PATCH /api/hospitals/:id    (ADMIN, own hospital only)
//   DELETE /api/hospitals/:id       (ADMIN, own hospital only - soft deactivate)

export const hospitalService = {
  register: (payload) => apiClient.post("/hospitals/register", payload),
  list: (query) => apiClient.get("/hospitals", query),
  get: (id) => apiClient.get(`/hospitals/${id}`),
  update: (id, payload) => apiClient.patch(`/hospitals/${id}`, payload),
  deactivate: (id) => apiClient.delete(`/hospitals/${id}`),
};
