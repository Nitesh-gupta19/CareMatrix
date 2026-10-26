import { useState } from "react";
import { departmentService } from "../../../services/departmentService";

export default function DepartmentForm({ hospitalId, onCreated }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [floor, setFloor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await departmentService.create({ hospitalId, name, code, floor });
      setName("");
      setCode("");
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
      <h4>Add Department</h4>
      <input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input aria-label="Code" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
      <input aria-label="Floor" placeholder="Floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add Department"}
      </button>
    </form>
  );
}
