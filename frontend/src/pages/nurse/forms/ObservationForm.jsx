import { useEffect, useState } from "react";
import { observationService } from "../../../services/observationService";
import { useFetch } from "../../../hooks/useFetch";
import DataState from "../../../components/common/DataState";
import SimpleTable from "../../../components/tables/SimpleTable";

const TYPES = ["temperature", "blood_pressure", "heart_rate", "oxygen_saturation", "respiratory_rate", "general_note"];

export default function ObservationForm({ admissions }) {
  const [admissionId, setAdmissionId] = useState(admissions[0]?._id || "");
  const [type, setType] = useState(TYPES[0]);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const observationsState = useFetch(
    () => (admissionId ? observationService.list({ admissionId, limit: 20 }) : Promise.resolve({ data: [] })),
    [admissionId]
  );

  useEffect(() => {
    if (!admissionId && admissions.length > 0) setAdmissionId(admissions[0]._id);
  }, [admissions]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    const admission = admissions.find((a) => a._id === admissionId);
    if (!admission) {
      setError("Select an admission.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await observationService.create({
        patientId: admission.patientId?._id || admission.patientId,
        admissionId,
        type,
        value,
        notes,
      });
      setValue("");
      setNotes("");
      observationsState.refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="inline-form">
        <select aria-label="Admission" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} required>
          <option value="">Select admission</option>
          {admissions.map((a) => (
            <option key={a._id} value={a._id}>
              {a.patientId?.name}
            </option>
          ))}
        </select>
        <select aria-label="Observation type" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input aria-label="Value (e.g. 98.6°F)" placeholder="Value (e.g. 98.6°F)" value={value} onChange={(e) => setValue(e.target.value)} required />
        <input aria-label="Notes (optional)" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Recording…" : "Record Observation"}
        </button>
      </form>

      <DataState
        loading={observationsState.loading}
        error={observationsState.error}
        data={observationsState.data}
        onRetry={observationsState.refetch}
        emptyMessage="No observations recorded yet for this admission."
      >
        {(observations) => (
          <SimpleTable
            columns={[
              { key: "type", label: "Type" },
              { key: "value", label: "Value" },
              { key: "notes", label: "Notes" },
              { key: "observedAt", label: "When", render: (r) => new Date(r.observedAt).toLocaleString() },
            ]}
            rows={observations}
          />
        )}
      </DataState>
    </div>
  );
}
