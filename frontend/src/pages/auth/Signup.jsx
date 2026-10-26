import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_PATH } from "../../utils/constants";
import { HospitalIcon } from "../../components/icons";
import FormField from "../../components/ui/FormField";
import Button from "../../components/ui/Button";

export default function Signup() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("PATIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [patientId, setPatientId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to={ROLE_HOME_PATH[user.role] || "/"} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await register({
        name: name.trim(), email: email.trim(), password, phone: phone.trim(), role,
        ...(role === "PATIENT" ? { patientId: patientId.trim().toUpperCase(), dateOfBirth } : {}),
      });
      navigate(ROLE_HOME_PATH[created.role] || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not create your account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand"><HospitalIcon size={26} /><span>CareMatrix</span></div>
        <p className="auth-card__tagline">Create your secure healthcare account</p>
        <form onSubmit={handleSubmit}>
          <FormField label="I am registering as" required>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="PATIENT">Patient</option>
              <option value="RELATIVE">Relative / caregiver</option>
            </select>
          </FormField>
          {role === "PATIENT" && <>
            <FormField label="Patient ID" required helperText="Use the ID provided by your hospital.">
              <input value={patientId} onChange={(e) => setPatientId(e.target.value)} required autoComplete="off" />
            </FormField>
            <FormField label="Date of birth" required helperText="Must match the date recorded by hospital staff.">
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </FormField>
          </>}
          <FormField label="Full name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </FormField>
          <FormField label="Phone (optional)">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </FormField>
          <FormField label="Password (at least 8 characters)" required>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </FormField>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" loading={submitting} style={{ width: "100%" }}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="auth-hint">Patient accounts are linked to an existing hospital record using your Patient ID and date of birth. If you cannot verify your record, please contact your hospital. Relative accounts do not automatically grant access to a patient's medical records.</p>
        <p className="auth-hint">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
