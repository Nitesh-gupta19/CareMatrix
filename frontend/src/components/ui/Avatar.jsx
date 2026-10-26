import React from "react";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Avatar({ name, size = 32 }) {
  return (
    <span className="cm-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }} aria-hidden="true">
      {initials(name) || "?"}
    </span>
  );
}
