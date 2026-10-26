import { useState } from "react";
import { bedService } from "../../../services/bedService";

export default function BedForm({ wards, onCreated }) {
  const [wardId, setWardId] = useState(wards[0]?._id || "");
  const [bedNumber, setBedNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!wardId) {
      setError("Create a ward first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await bedService.create({ wardId, bedNumber });
      setBedNumber("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <h4>Add Bed</h4>
      <select aria-label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)} required>
        <option value="">Select ward</option>
        {wards.map((w) => (
          <option key={w._id} value={w._id}>
            {w.name}
          </option>
        ))}
      </select>
      <input
        aria-label="Bed number" placeholder="Bed number"
        value={bedNumber}
        onChange={(e) => setBedNumber(e.target.value)}
        required
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add Bed"}
      </button>
    </form>
  );
}
