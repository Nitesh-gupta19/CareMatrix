import { useEffect, useState } from "react";
import { bedService } from "../../../services/bedService";
import { admissionService } from "../../../services/admissionService";

export default function TransferForm({ admission, wards, onDone }) {
  const [wardId, setWardId] = useState("");
  const [bedId, setBedId] = useState("");
  const [availableBeds, setAvailableBeds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setBedId("");
    if (!wardId) {
      setAvailableBeds([]);
      return;
    }
    bedService.list({ wardId, status: "available", limit: 100 }).then(({ data }) => setAvailableBeds(data || []));
  }, [wardId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await admissionService.transfer(admission._id, { wardId, bedId });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form-row">
      <select aria-label="New ward" value={wardId} onChange={(e) => setWardId(e.target.value)} required>
        <option value="">New ward</option>
        {wards.map((w) => (
          <option key={w._id} value={w._id}>
            {w.name}
          </option>
        ))}
      </select>
      <select aria-label="New bed" value={bedId} onChange={(e) => setBedId(e.target.value)} required disabled={!wardId}>
        <option value="">New bed</option>
        {availableBeds.map((b) => (
          <option key={b._id} value={b._id}>
            {b.bedNumber}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
      <button type="submit" disabled={submitting || !bedId}>
        {submitting ? "Transferring…" : "Transfer"}
      </button>
    </form>
  );
}
