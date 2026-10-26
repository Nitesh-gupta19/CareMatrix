import React from "react";

/**
 * columns: [{ key, label, render?(row) }]
 * rows: array of data objects
 * Same API as before - every dashboard already using this gets the
 * visual upgrade with zero changes. Wrapped in a horizontally scrollable
 * container, and on mobile CSS reflows rows into stacked key/value cards
 * (see styles.css) so wide tables never force page-level overflow.
 */
export default function SimpleTable({ columns, rows, rowKey = (row) => row._id }) {
  return (
    <div className="cm-table-scroll">
      <table className="cm-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
