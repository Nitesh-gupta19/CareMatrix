import React from "react";
import { AlertIcon } from "../icons";
import Button from "../ui/Button";

export default function ErrorState({ error, onRetry }) {
  const message = error?.message || "Something went wrong.";
  return (
    <div className="cm-state cm-state--error" role="alert">
      <AlertIcon size={20} />
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
