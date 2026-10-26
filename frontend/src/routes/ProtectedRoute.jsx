import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Gate for "must be logged in at all". This is a UX convenience only -
 * the backend enforces the real authorization on every request regardless
 * of what this component does (Section: "IMPORTANT: Frontend role checks
 * are for navigation/UX only").
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: "2rem" }}>Checking your session…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
