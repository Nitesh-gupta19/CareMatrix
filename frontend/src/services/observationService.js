import { apiClient } from "./api";

// Matches backend/routes/observationRoutes.js (router.use(protect)):
//   POST /api/observations  (NURSE) { patientId, admissionId, type, value, notes, observedAt }
//   GET  /api/observations  (auth, role-scoped) ?admissionId= (required) &page=&limit=
//   No PATCH/DELETE - observations are append-only clinical records.

export const observationService = {
  create: (payload) => apiClient.post("/observations", payload),
  list: (query) => apiClient.get("/observations", query),
};
