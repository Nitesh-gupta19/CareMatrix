import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_PATH } from "../../utils/constants";
import { HospitalIcon } from "../../components/icons";
import FormField from "../../components/ui/FormField";
import Button from "../../components/ui/Button";

/**
 * Same authentication behavior as before - login(), redirect logic,
 * error handling - only the visual treatment changed. Demo accounts
 * still work exactly as documented in the backend seed output.
 */
export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (isAuthenticated) {
    const target = location.state?.from?.pathname || ROLE_HOME_PATH[user.role] || "/";
    return <Navigate to={target} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      const target = location.state?.from?.pathname || ROLE_HOME_PATH[loggedInUser.role] || "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <HospitalIcon size={26} />
          <span>CareMatrix</span>
        </div>
        <p className="auth-card__tagline">Connected healthcare management</p>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
          </FormField>
          <FormField label="Password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </FormField>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" loading={submitting} style={{ width: "100%" }}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="auth-hint">New to CareMatrix? <Link to="/signup">Create a patient or relative account</Link></p>

        <p className="auth-hint">
          Demo accounts (see backend seed output): admin@carematrix.demo, sarah.sharma@carematrix.demo,
          john.fernandes@carematrix.demo, patient@carematrix.demo, relative@carematrix.demo
        </p>
      </div>
    </div>
  );
}
