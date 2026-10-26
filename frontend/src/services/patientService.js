import { apiClient } from "./api";

// Matches backend/routes/patientRoutes.js:
//   GET  /api/patients/lookup/:patientId (public) - Patient Access flow
//   POST /api/patients                   (ADMIN, DOCTOR) { name, dateOfBirth, gender,
//                                          bloodGroup, phone, address, emergencyContact }
//   GET  /api/patients                   (auth, staff) ?hospitalId=&page=&limit=
//   GET  /api/patients/me                (auth, PATIENT) -- Phase 3 addition
//   GET  /api/patients/:id               (auth, role-scoped)
//   PUT/PATCH /api/patients/:id          (auth)

export const patientService = {
  lookupForAccess: (patientId) => apiClient.get(`/patients/lookup/${patientId}`),
  create: (payload) => apiClient.post("/patients", payload),
  list: (query) => apiClient.get("/patients", query),
  getMyProfile: () => apiClient.get("/patients/me"),
  get: (id) => apiClient.get(`/patients/${id}`),
  update: (id, payload) => apiClient.patch(`/patients/${id}`, payload),
};
