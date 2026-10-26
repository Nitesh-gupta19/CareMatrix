import { apiClient } from "./api";

// Matches backend/routes/doctorRoutes.js:
//   POST /api/doctors                (ADMIN only, own hospital - Phase 3.1: no longer public)
//        { name, email, password, phone, doctorCode, specialization,
//          qualification, licenseNumber, experience, hospitalId, departmentId }
//   GET  /api/doctors                (auth) ?hospitalId=&departmentId=&page=&limit=
//   GET  /api/doctors/me             (auth, DOCTOR)  -- Phase 3 addition
//   GET  /api/doctors/:id            (auth)
//   PUT/PATCH /api/doctors/:id       (DOCTOR self, or ADMIN)
//   POST /api/doctors/:id/affiliations (DOCTOR self, or ADMIN) { hospitalId, departmentId }

export const doctorService = {
  register: (payload) => apiClient.post("/doctors", payload),
  list: (query) => apiClient.get("/doctors", query),
  getMyProfile: () => apiClient.get("/doctors/me"),
  get: (id) => apiClient.get(`/doctors/${id}`),
  update: (id, payload) => apiClient.patch(`/doctors/${id}`, payload),
  addAffiliation: (id, payload) => apiClient.post(`/doctors/${id}/affiliations`, payload),
};
