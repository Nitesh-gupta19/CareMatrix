import React from "react";

/**
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 * size: 'md' | 'sm'
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`cm-btn cm-btn--${variant} cm-btn--${size} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="cm-btn__spinner" aria-hidden="true" />}
      <span className={loading ? "cm-btn__label--loading" : undefined}>{children}</span>
    </button>
  );
}
