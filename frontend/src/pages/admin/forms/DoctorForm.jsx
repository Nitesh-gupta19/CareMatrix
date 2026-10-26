import { useState } from "react";
import { doctorService } from "../../../services/doctorService";

export default function DoctorForm({ hospitalId, departments, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    doctorCode: "",
    licenseNumber: "",
    specialization: "",
    qualification: "",
    experience: "",
    departmentId: departments[0]?._id || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.departmentId) {
      setError("Create a department first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await doctorService.register({ ...form, hospitalId, experience: Number(form.experience) || 0 });
      setForm({
        name: "",
        email: "",
        password: "",
        doctorCode: "",
        licenseNumber: "",
        specialization: "",
        qualification: "",
        experience: "",
        departmentId: departments[0]?._id || "",
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <h4>Add Doctor</h4>
      <input aria-label="Full name" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
      <input
        aria-label="Email" type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        required
      />
      <input
        aria-label="Temporary password" type="password"
        placeholder="Temporary password"
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
        required
      />
      <input
        aria-label="Doctor code" placeholder="Doctor code"
        value={form.doctorCode}
        onChange={(e) => update("doctorCode", e.target.value)}
        required
      />
      <input
        aria-label="License number" placeholder="License number"
        value={form.licenseNumber}
        onChange={(e) => update("licenseNumber", e.target.value)}
        required
      />
      <input
        aria-label="Specialization" placeholder="Specialization"
        value={form.specialization}
        onChange={(e) => update("specialization", e.target.value)}
      />
      <input
        aria-label="Qualification" placeholder="Qualification"
        value={form.qualification}
        onChange={(e) => update("qualification", e.target.value)}
      />
      <input
        aria-label="Years experience" type="number"
        placeholder="Years experience"
        value={form.experience}
        onChange={(e) => update("experience", e.target.value)}
      />
      <select aria-label="Department" value={form.departmentId} onChange={(e) => update("departmentId", e.target.value)} required>
        <option value="">Select department</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add Doctor"}
      </button>
    </form>
  );
}
