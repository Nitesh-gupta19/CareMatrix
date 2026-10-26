import React, { useEffect, useRef } from "react";
import { CloseIcon } from "../icons";
import IconButton from "./IconButton";

export default function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cm-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="cm-modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={dialogRef}>
        <header className="cm-modal__header">
          <h3 className="cm-modal__title">{title}</h3>
          <IconButton label="Close" onClick={onClose}>
            <CloseIcon size={18} />
          </IconButton>
        </header>
        <div className="cm-modal__body">{children}</div>
        {footer && <footer className="cm-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
