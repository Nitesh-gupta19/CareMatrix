import { apiClient } from "./api";

// Matches backend/routes/admissionRoutes.js (router.use(protect) - ALL require auth):
//   POST /api/admissions              (ADMIN, DOCTOR)
//        { patientId, hospitalId, departmentId, doctorId, wardId, bedId, reason }
//   GET  /api/admissions              (auth, role-scoped automatically) ?status=&page=&limit=
//   GET  /api/admissions/:id          (auth, role-scoped)
//   PUT/PATCH /api/admissions/:id     (ADMIN, DOCTOR) { reason }
//   POST /api/admissions/:id/discharge (ADMIN, DOCTOR)
//   PATCH /api/admissions/:id/transfer (ADMIN, DOCTOR) { wardId, bedId }
//
// NOTE: the backend does NOT accept a hospitalId filter for DOCTOR-role
// requests (listAdmissions forces filter.doctorId for doctors regardless
// of query params) - any "current hospital" filtering for a multi-hospital
// doctor happens client-side over the doctor's own returned admissions.
// See admissionService.list() callers for that logic.

export const admissionService = {
  create: (payload) => apiClient.post("/admissions", payload),
  list: (query) => apiClient.get("/admissions", query),
  get: (id) => apiClient.get(`/admissions/${id}`),
  update: (id, payload) => apiClient.patch(`/admissions/${id}`, payload),
  discharge: (id) => apiClient.post(`/admissions/${id}/discharge`),
  transfer: (id, payload) => apiClient.patch(`/admissions/${id}/transfer`, payload),
};
