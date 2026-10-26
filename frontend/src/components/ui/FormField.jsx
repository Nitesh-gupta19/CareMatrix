import React from "react";

let idCounter = 0;

export default function FormField({ label, required, error, helperText, children }) {
  const id = React.useMemo(() => `field-${++idCounter}`, []);
  const control = React.cloneElement(children, {
    id,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? `${id}-error` : helperText ? `${id}-helper` : undefined,
  });

  return (
    <div className="cm-form-field">
      {label && (
        <label htmlFor={id} className="cm-form-field__label">
          {label} {required && <span className="cm-form-field__required">*</span>}
        </label>
      )}
      {control}
      {error ? (
        <span id={`${id}-error`} className="cm-form-field__error">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${id}-helper`} className="cm-form-field__helper">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
