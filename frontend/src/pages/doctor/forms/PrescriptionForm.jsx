import { useState } from "react";
import { prescriptionService } from "../../../services/prescriptionService";

const EMPTY_MEDICINE = { name: "", dosage: "", frequency: "", duration: "", timing: "", notes: "" };

export default function PrescriptionForm({ admissions, onCreated }) {
  const [admissionId, setAdmissionId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }]);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateMedicine(index, field, value) {
    setMedicines((list) => list.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMedicine() {
    setMedicines((list) => [...list, { ...EMPTY_MEDICINE }]);
  }

  function removeMedicine(index) {
    setMedicines((list) => list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const admission = admissions.find((a) => a._id === admissionId);
    if (!admission) {
      setError("Select an admission.");
      return;
    }
    const cleanedMedicines = medicines.filter((m) => m.name.trim() !== "");
    setSubmitting(true);
    setError(null);
    try {
      await prescriptionService.create({
        patientId: admission.patientId?._id || admission.patientId,
        admissionId,
        diagnosis,
        medicines: cleanedMedicines,
        instructions,
      });
      setDiagnosis("");
      setMedicines([{ ...EMPTY_MEDICINE }]);
      setInstructions("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <h4>Create Prescription</h4>
      <select aria-label="Admission" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} required>
        <option value="">Select admission</option>
        {admissions.map((a) => (
          <option key={a._id} value={a._id}>
            {a.patientId?.name}
          </option>
        ))}
      </select>
      <input aria-label="Diagnosis" placeholder="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />

      <fieldset>
        <legend>Medicines</legend>
        {medicines.map((med, index) => (
          <div key={index} className="inline-form-row">
            <input
              aria-label="Name" placeholder="Name"
              value={med.name}
              onChange={(e) => updateMedicine(index, "name", e.target.value)}
            />
            <input
              aria-label="Dosage" placeholder="Dosage"
              value={med.dosage}
              onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
            />
            <input
              aria-label="Frequency" placeholder="Frequency"
              value={med.frequency}
              onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
            />
            <input
              aria-label="Duration" placeholder="Duration"
              value={med.duration}
              onChange={(e) => updateMedicine(index, "duration", e.target.value)}
            />
            <input
              aria-label="Timing" placeholder="Timing"
              value={med.timing}
              onChange={(e) => updateMedicine(index, "timing", e.target.value)}
            />
            <input
              aria-label="Notes" placeholder="Notes"
              value={med.notes}
              onChange={(e) => updateMedicine(index, "notes", e.target.value)}
            />
            {medicines.length > 1 && (
              <button type="button" onClick={() => removeMedicine(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addMedicine}>
          + Add another medicine
        </button>
      </fieldset>

      <input
        aria-label="Instructions" placeholder="Instructions"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create Prescription"}
      </button>
    </form>
  );
}
