import { useEffect, useState } from "react";
import { patientService } from "../../../services/patientService";
import { bedService } from "../../../services/bedService";
import { admissionService } from "../../../services/admissionService";

/**
 * The backend has no "list all patients" endpoint (Patient records are
 * only ever surfaced through an active Admission), so a patient who was
 * just created via intake and has no admission yet cannot appear in any
 * dropdown. The real, non-fake way to resolve them here is the same
 * public lookup the Patient Access landing flow uses:
 * GET /api/patients/lookup/:patientId - so this form asks for that
 * human-readable Patient ID and resolves the real Patient _id from it.
 */
export default function AdmissionForm({ hospitalId, departments, doctors, wards, onCreated }) {
  const [patientCode, setPatientCode] = useState("");
  const [resolvedPatient, setResolvedPatient] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [departmentId, setDepartmentId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [wardId, setWardId] = useState("");
  const [bedId, setBedId] = useState("");
  const [reason, setReason] = useState("");
  const [availableBeds, setAvailableBeds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Only doctors with an ACTIVE affiliation to THIS hospital AND the
  // currently selected department are valid choices - filtered from the
  // real hospitalAffiliations data, not assumed.
  const eligibleDoctors = doctors.filter((doc) =>
    (doc.hospitalAffiliations || []).some(
      (a) =>
        String(a.hospitalId?._id || a.hospitalId) === String(hospitalId) &&
        String(a.departmentId?._id || a.departmentId) === String(departmentId) &&
        a.status === "active"
    )
  );

  useEffect(() => {
    setBedId("");
    if (!wardId) {
      setAvailableBeds([]);
      return;
    }
    bedService.list({ wardId, status: "available", limit: 100 }).then(({ data }) => {
      setAvailableBeds(data || []);
    });
  }, [wardId]);

  async function handleLookup(e) {
    e.preventDefault();
    setLookingUp(true);
    setLookupError(null);
    setResolvedPatient(null);
    try {
      const { data } = await patientService.lookupForAccess(patientCode.trim());
      setResolvedPatient(data.patient);
      // Backend now returns only a boolean flag here (Phase 3 rebuild
      // security fix) - it never exposes hospital/ward/bed/doctor details
      // through this public endpoint, so there is nothing more specific
      // to show than "an active admission already exists".
      if (data.hasActiveAdmission) {
        setLookupError(
          "This patient already has an active admission. Discharge it first before creating a new one."
        );
      }
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await admissionService.create({
        patientId: resolvedPatient._id,
        hospitalId,
        departmentId,
        doctorId,
        wardId,
        bedId,
        reason,
      });
      setResolvedPatient(null);
      setPatientCode("");
      setDepartmentId("");
      setDoctorId("");
      setWardId("");
      setBedId("");
      setReason("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inline-form">
      <h4>Create Admission</h4>

      <form onSubmit={handleLookup} className="inline-form-row">
        <input
          aria-label="Patient ID (e.g. PT-1000)" placeholder="Patient ID (e.g. PT-1000)"
          value={patientCode}
          onChange={(e) => setPatientCode(e.target.value)}
          required
        />
        <button type="submit" disabled={lookingUp}>
          {lookingUp ? "Looking up…" : "Find patient"}
        </button>
      </form>
      {lookupError && <p className="form-error">{lookupError}</p>}
      {resolvedPatient && <p className="form-success">Found: {resolvedPatient.name}</p>}

      {resolvedPatient && (
        <form onSubmit={handleSubmit} className="inline-form-row">
          <select aria-label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <select aria-label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required disabled={!departmentId}>
            <option value="">Select doctor</option>
            {eligibleDoctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.userId?.name} ({doc.specialization})
              </option>
            ))}
          </select>

          <select aria-label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)} required>
            <option value="">Select ward</option>
            {wards.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>

          <select aria-label="Bed" value={bedId} onChange={(e) => setBedId(e.target.value)} required disabled={!wardId}>
            <option value="">Select available bed</option>
            {availableBeds.map((bed) => (
              <option key={bed._id} value={bed._id}>
                {bed.bedNumber}
              </option>
            ))}
          </select>
          {wardId && availableBeds.length === 0 && <span>No available beds in this ward.</span>}

          <input aria-label="Reason for admission" placeholder="Reason for admission" value={reason} onChange={(e) => setReason(e.target.value)} />

          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Admitting…" : "Create Admission"}
          </button>
        </form>
      )}
    </div>
  );
}
