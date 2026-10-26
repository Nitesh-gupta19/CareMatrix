import { apiClient } from "./api";

// Matches backend/routes/authRoutes.js exactly:
//   POST /api/auth/register  { name, email, password, role, phone }
//   POST /api/auth/login     { email, password }
//   GET  /api/auth/me        (protected)

export const authService = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  me: () => apiClient.get("/auth/me"),
};
