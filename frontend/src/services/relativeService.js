import { apiClient } from "./api";

// Matches backend/routes/relativeRoutes.js:
//   POST  /api/relatives      (public/optional-auth) { name, email, password, phone,
//                              patientId, relationship } - name/email/password only
//                              required when NOT already logged in as a relative
//   GET   /api/relatives      (auth) - RELATIVE: own links; ADMIN: all requests for
//                              patients with history at their hospital, optionally
//                              narrowed with ?patientId= and/or ?accessStatus=
//   GET   /api/relatives/:id  (auth)
//   PATCH /api/relatives/:id  (ADMIN only, own hospital's patients only) { accessStatus, isPrimaryContact }

export const relativeService = {
  requestAccess: (payload) => apiClient.post("/relatives", payload),
  list: (query) => apiClient.get("/relatives", query),
  get: (id) => apiClient.get(`/relatives/${id}`),
  updateAccessStatus: (id, payload) => apiClient.patch(`/relatives/${id}`, payload),
};
