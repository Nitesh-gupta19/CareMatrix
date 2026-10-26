import { useState } from "react";
import { wardService } from "../../../services/wardService";

const TYPES = ["general", "icu", "ccu", "private", "emergency", "pediatric"];

export default function WardForm({ hospitalId, departments, onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("general");
  const [departmentId, setDepartmentId] = useState("");
  const [floor, setFloor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await wardService.create({ hospitalId, departmentId: departmentId || null, name, type, floor });
      setName("");
      setFloor("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <h4>Add Ward</h4>
      <input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <select aria-label="Ward type" value={type} onChange={(e) => setType(e.target.value)}>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select aria-label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
        <option value="">(no specific department)</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>
      <input aria-label="Floor" placeholder="Floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add Ward"}
      </button>
    </form>
  );
}
