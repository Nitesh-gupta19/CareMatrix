import { useState } from "react";
import { nurseService } from "../../../services/nurseService";

const SHIFTS = ["morning", "evening", "night", "rotational"];

export default function NurseForm({ hospitalId, departments, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    qualification: "",
    shift: "rotational",
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
      await nurseService.register({ ...form, hospitalId });
      setForm({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        qualification: "",
        shift: "rotational",
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
      <h4>Add Nurse</h4>
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
        aria-label="Employee ID" placeholder="Employee ID"
        value={form.employeeId}
        onChange={(e) => update("employeeId", e.target.value)}
        required
      />
      <input
        aria-label="Qualification" placeholder="Qualification"
        value={form.qualification}
        onChange={(e) => update("qualification", e.target.value)}
      />
      <select aria-label="Shift" value={form.shift} onChange={(e) => update("shift", e.target.value)}>
        {SHIFTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
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
        {submitting ? "Adding…" : "Add Nurse"}
      </button>
    </form>
  );
}
