import React from "react";

export default function Card({ title, actions, className = "", children, ...rest }) {
  return (
    <section className={`cm-card ${className}`.trim()} {...rest}>
      {(title || actions) && (
        <header className="cm-card__header">
          {title && <h3 className="cm-card__title">{title}</h3>}
          {actions && <div className="cm-card__actions">{actions}</div>}
        </header>
      )}
      <div className="cm-card__body">{children}</div>
    </section>
  );
}
