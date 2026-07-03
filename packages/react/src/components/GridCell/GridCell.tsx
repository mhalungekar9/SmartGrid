import type { Column } from "@smartgrid/core";
import type { ReactNode } from "react";
import "./GridCell.css";
import { useGridContext } from "../../context/GridContext";

interface Props<T> {
  row: T;
  rowIndex: number;
  columnIndex: number;
  column: Column<T>;
}

export function GridCell<T>({ row, rowIndex, columnIndex, column }: Props<T>) {
  const {
    getColumnStyle,
    editingCell,
    startCellEdit,
    updateCellDraft,
    commitCellEdit,
    cancelCellEdit,
    activeCell,
    selectionAnchor,
    setActiveCell,
    setSelectionAnchor,
  } = useGridContext<T>();
  const value = column.valueGetter?.(row) ?? row[column.field];
  const isEditing =
    editingCell?.rowIndex === rowIndex && editingCell.columnId === column.id;
  const isActiveCell =
    activeCell?.rowIndex === rowIndex && activeCell.columnIndex === columnIndex;
  const rangeStartRow = Math.min(
    activeCell?.rowIndex ?? rowIndex,
    selectionAnchor?.rowIndex ?? rowIndex,
  );
  const rangeEndRow = Math.max(
    activeCell?.rowIndex ?? rowIndex,
    selectionAnchor?.rowIndex ?? rowIndex,
  );
  const rangeStartColumn = Math.min(
    activeCell?.columnIndex ?? columnIndex,
    selectionAnchor?.columnIndex ?? columnIndex,
  );
  const rangeEndColumn = Math.max(
    activeCell?.columnIndex ?? columnIndex,
    selectionAnchor?.columnIndex ?? columnIndex,
  );
  const isInRange =
    activeCell &&
    selectionAnchor &&
    rowIndex >= rangeStartRow &&
    rowIndex <= rangeEndRow &&
    columnIndex >= rangeStartColumn &&
    columnIndex <= rangeEndColumn;
  const renderedValue: ReactNode = column.cellRenderer
    ? (column.cellRenderer(value, row) as ReactNode)
    : column.valueFormatter
      ? column.valueFormatter(value)
      : String(value ?? "");

  if (isEditing) {
    return (
      <div
        className="sg-cell sg-cell--editing"
        style={getColumnStyle(column.id)}
      >
        <input
          className="sg-cell-input"
          autoFocus
          value={editingCell.draftValue}
          onChange={(event) => updateCellDraft(event.target.value)}
          onBlur={commitCellEdit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitCellEdit();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelCellEdit();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`sg-cell${isInRange ? " sg-cell--range" : ""}${isActiveCell ? " sg-cell--active" : ""}`}
      style={getColumnStyle(column.id)}
      tabIndex={column.editable ? 0 : -1}
      onClick={(event) => {
        if (event.shiftKey && activeCell) {
          setSelectionAnchor(rowIndex, columnIndex);
          return;
        }

        setActiveCell(rowIndex, columnIndex);
      }}
      onDoubleClick={() => {
        if (column.editable) {
          startCellEdit(rowIndex, column.id, String(value ?? ""));
        }
      }}
      onKeyDown={(event) => {
        if (column.editable && (event.key === "Enter" || event.key === "F2")) {
          event.preventDefault();
          startCellEdit(rowIndex, column.id, String(value ?? ""));
        }
      }}
    >
      {renderedValue}
    </div>
  );
}
