import React from "react";

/** items: [{ label, value }] */
export default function InfoList({ items }) {
  return (
    <ul className="cm-info-list">
      {items.map((item) => (
        <li key={item.label}>
          <span className="cm-info-label">{item.label}</span>
          <span className="cm-info-value">{item.value ?? "—"}</span>
        </li>
      ))}
    </ul>
  );
}
