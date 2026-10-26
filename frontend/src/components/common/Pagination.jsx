import React from "react";
import IconButton from "../ui/IconButton";
import { ChevronDownIcon } from "../icons";

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;

  return (
    <div className="cm-pagination">
      <IconButton label="Previous page" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronDownIcon size={16} style={{ transform: "rotate(90deg)" }} />
      </IconButton>
      <span className="cm-pagination__label">
        Page {page} of {totalPages}
      </span>
      <IconButton label="Next page" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <ChevronDownIcon size={16} style={{ transform: "rotate(-90deg)" }} />
      </IconButton>
    </div>
  );
}
