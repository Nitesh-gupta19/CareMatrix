import React from "react";

export function Badge({ tone = "neutral", children }) {
  return <span className={`cm-badge cm-badge--${tone}`}>{children}</span>;
}

/**
 * Maps every enum value that actually exists in the backend models to a
 * tone + readable label. Status is never conveyed by color alone - the
 * text label is always rendered too (Section 16: accessibility).
 */
const STATUS_MAP = {
  available: { tone: "success", label: "Available" },
  occupied: { tone: "danger", label: "Occupied" },
  maintenance: { tone: "warning", label: "Maintenance" },
  reserved: { tone: "info", label: "Reserved" },
  admitted: { tone: "success", label: "Admitted" },
  discharged: { tone: "neutral", label: "Discharged" },
  cancelled: { tone: "danger", label: "Cancelled" },
  pending: { tone: "warning", label: "Pending" },
  in_progress: { tone: "info", label: "In progress" },
  completed: { tone: "success", label: "Completed" },
  low: { tone: "neutral", label: "Low" },
  medium: { tone: "info", label: "Medium" },
  high: { tone: "warning", label: "High" },
  urgent: { tone: "danger", label: "Urgent" },
  active: { tone: "success", label: "Active" },
  discontinued: { tone: "neutral", label: "Discontinued" },
  approved: { tone: "success", label: "Approved" },
  revoked: { tone: "danger", label: "Revoked" },
  inactive: { tone: "neutral", label: "Inactive" },
  suspended: { tone: "danger", label: "Suspended" },
};

export default function StatusBadge({ status }) {
  const entry = STATUS_MAP[status] || { tone: "neutral", label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
