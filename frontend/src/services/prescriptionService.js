import { apiClient } from "./api";

// Matches backend/routes/prescriptionRoutes.js (router.use(protect)):
//   POST /api/prescriptions          (DOCTOR) { patientId, admissionId, diagnosis,
//                                     medicines: [{name,dosage,frequency,duration,timing,notes}],
//                                     instructions }
//   GET  /api/prescriptions          (auth, role-scoped) ?admissionId=&patientId=(RELATIVE only)&page=&limit=
//   GET  /api/prescriptions/:id      (auth, role-scoped)
//   PUT/PATCH /api/prescriptions/:id (prescribing DOCTOR only) { diagnosis, medicines, instructions, status }

export const prescriptionService = {
  create: (payload) => apiClient.post("/prescriptions", payload),
  list: (query) => apiClient.get("/prescriptions", query),
  get: (id) => apiClient.get(`/prescriptions/${id}`),
  update: (id, payload) => apiClient.patch(`/prescriptions/${id}`, payload),
};
