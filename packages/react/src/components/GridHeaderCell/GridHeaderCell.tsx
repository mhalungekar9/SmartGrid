import type { Column } from "@smartgrid/core";
import "./GridHeaderCell.css";
import { useGridContext } from "../../context/GridContext";

interface Props<T> {
  column: Column<T>;
  width: number;
  sortDirection: "asc" | "desc" | null;
  onSort: (columnId: string) => void;
  onResizeStart: (columnId: string, startWidth: number, startX: number) => void;
  onAutoSize: (columnId: string) => void;
}

export function GridHeaderCell<T>({
  column,
  width,
  sortDirection,
  onSort,
  onResizeStart,
  onAutoSize,
}: Props<T>) {
  const { getColumnStyle } = useGridContext<T>();

  return (
    <div
      className="sg-header-cell"
      role="columnheader"
      aria-sort={
        sortDirection
          ? sortDirection === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      style={{ width, ...getColumnStyle(column.id) }}
      onClick={() => onSort(column.id)}
    >
      <span className="sg-header-label">
        {column.headerName}
        {sortDirection ? (
          <span className="sg-sort-indicator">
            {sortDirection === "asc" ? "▲" : "▼"}
          </span>
        ) : null}
      </span>
      <div
        className="sg-resize-handle"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onResizeStart(column.id, width, event.clientX);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAutoSize(column.id);
        }}
      />
    </div>
  );
}
