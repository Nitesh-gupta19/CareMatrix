import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME_PATH } from "../utils/constants";

/**
 * Must be nested under <ProtectedRoute /> (so `user` is guaranteed to
 * exist). Redirects a wrong-role user to THEIR OWN dashboard rather than
 * to login, since they are authenticated - just in the wrong section.
 * Again: UX only. The backend's roleMiddleware is the actual enforcement.
 */
export default function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role)) {
    return <Navigate to={ROLE_HOME_PATH[user.role] || "/login"} replace />;
  }

  return <Outlet />;
}
