import React from "react";

export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="cm-state cm-state--loading" role="status" aria-live="polite">
      <span className="cm-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
