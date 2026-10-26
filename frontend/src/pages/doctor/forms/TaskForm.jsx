import { useEffect, useState } from "react";
import { nurseService } from "../../../services/nurseService";
import { taskService } from "../../../services/taskService";

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function TaskForm({ admissions, onCreated }) {
  const [admissionId, setAdmissionId] = useState("");
  const [nurses, setNurses] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedAdmission = admissions.find((a) => a._id === admissionId);

  useEffect(() => {
    setAssignedTo("");
    if (!selectedAdmission) {
      setNurses([]);
      return;
    }
    const hospitalId = selectedAdmission.hospitalId?._id || selectedAdmission.hospitalId;
    nurseService.list({ hospitalId, limit: 100 }).then(({ data }) => setNurses(data || []));
  }, [admissionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAdmission) {
      setError("Select an admission.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await taskService.create({
        title,
        assignedTo,
        patientId: selectedAdmission.patientId?._id || selectedAdmission.patientId,
        admissionId,
        priority,
      });
      setTitle("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <h4>Create Task</h4>
      <select aria-label="Admission" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} required>
        <option value="">Select admission</option>
        {admissions.map((a) => (
          <option key={a._id} value={a._id}>
            {a.patientId?.name}
          </option>
        ))}
      </select>
      <select aria-label="Assign to nurse" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required disabled={!admissionId}>
        <option value="">Select nurse</option>
        {nurses.map((n) => (
          <option key={n._id} value={n.userId?._id || n.userId}>
            {n.userId?.name}
          </option>
        ))}
      </select>
      <input aria-label="Task title" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Assigning…" : "Assign Task"}
      </button>
    </form>
  );
}
