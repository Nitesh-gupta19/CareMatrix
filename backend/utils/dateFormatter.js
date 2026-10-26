/**
 * Presentation-only helpers. Stored dates (dateOfBirth, admissionDate,
 * dischargeDate, dueDate, observedAt, timestamps) always remain real
 * Mongoose Date fields in the database - these helpers are only for
 * formatting a Date for display/logging, never for storage.
 */

function formatDateForDisplay(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTimeForDisplay(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = { formatDateForDisplay, formatDateTimeForDisplay };
