import React from "react";

export default function StatCard({ label, value, icon, tone = "neutral" }) {
  return (
    <div className={`cm-stat-card cm-stat-card--${tone}`}>
      {icon && <span className="cm-stat-card__icon">{icon}</span>}
      <div>
        <div className="cm-stat-card__value">{value ?? "—"}</div>
        <div className="cm-stat-card__label">{label}</div>
      </div>
    </div>
  );
}
