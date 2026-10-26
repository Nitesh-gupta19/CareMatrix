import React from "react";

export default function PageHeader({ title, description, actions }) {
  return (
    <div className="cm-page-header">
      <div>
        <h1 className="cm-page-header__title">{title}</h1>
        {description && <p className="cm-page-header__description">{description}</p>}
      </div>
      {actions && <div className="cm-page-header__actions">{actions}</div>}
    </div>
  );
}
