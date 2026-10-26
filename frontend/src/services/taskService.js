import { apiClient } from "./api";

// Matches backend/routes/taskRoutes.js (router.use(protect)):
//   POST  /api/tasks             (DOCTOR) { title, description, assignedTo (User _id of a
//                                 NURSE), patientId, admissionId, priority, dueDate }
//   GET   /api/tasks             (auth, role-scoped: NURSE->own assignedTo, DOCTOR->own
//                                 assignedBy, ADMIN->all) ?status=&admissionId=&page=&limit=
//   GET   /api/tasks/:id         (auth)
//   PATCH /api/tasks/:id/status  (assigned NURSE, or assigning DOCTOR to cancel) { status }

export const taskService = {
  create: (payload) => apiClient.post("/tasks", payload),
  list: (query) => apiClient.get("/tasks", query),
  get: (id) => apiClient.get(`/tasks/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
};
