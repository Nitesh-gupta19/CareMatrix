import { useState } from "react";
import { patientService } from "../../../services/patientService";

export default function PatientForm({ onCreated }) {
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const { data } = await patientService.create({ name, dateOfBirth, gender, phone });
      setCreated(data);
      setName("");
      setDateOfBirth("");
      setPhone("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <h4>Add Patient (intake)</h4>
      <input aria-label="Full name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      <select aria-label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <input aria-label="Phone" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      {created && (
        <p className="form-success">
          Created — Patient ID: <strong>{created.patientId}</strong> (needed for admission/relative access)
        </p>
      )}
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add Patient"}
      </button>
    </form>
  );
}
