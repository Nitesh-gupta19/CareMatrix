import React from "react";

export default function IconButton({ label, variant = "ghost", className = "", children, ...rest }) {
  return (
    <button type="button" className={`cm-icon-btn cm-icon-btn--${variant} ${className}`.trim()} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
