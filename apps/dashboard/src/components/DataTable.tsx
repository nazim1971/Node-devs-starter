'use client';

import React from 'react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found.',
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={`data-table-wrapper ${className}`}>
        <div className="data-table__loading">
          <span className="spinner" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className={`data-table-wrapper ${className}`}>
      <table className="data-table">
        <thead className="data-table__head">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`data-table__th data-table__th--${col.align ?? 'left'}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="data-table__body">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="data-table__empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id} className="data-table__row">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`data-table__td data-table__td--${col.align ?? 'left'}`}
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
