import React from "react";
import { InboxIcon } from "../icons";

export default function EmptyState({ message = "Nothing to show yet." }) {
  return (
    <div className="cm-state cm-state--empty">
      <InboxIcon size={22} />
      <p>{message}</p>
    </div>
  );
}
