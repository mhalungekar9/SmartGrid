import type { PropsWithChildren } from "react";
import { useGridContext } from "../../context/GridContext";
import "./GridRoot.css";

export function GridRoot({ children }: PropsWithChildren) {
  const {
    rows,
    columns,
    selectedRowIndex,
    onRowSelect,
    startCellEdit,
    activeCell,
    selectionAnchor,
    clearSelectionAnchor,
    copySelection,
    pasteSelection,
    moveActiveCell,
  } = useGridContext<any>();

  const firstEditableColumn = columns.find(
    (column) => !column.hidden && column.editable !== false,
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
      event.preventDefault();
      void copySelection();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
      return;
    }

    if (rows.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveCell(1, 0, event.shiftKey);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveCell(-1, 0, event.shiftKey);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveActiveCell(0, -1, event.shiftKey);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveActiveCell(0, 1, event.shiftKey);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      onRowSelect(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      onRowSelect(rows.length - 1);
      return;
    }

    if (
      (event.key === "Enter" || event.key === "F2") &&
      selectedRowIndex != null
    ) {
      event.preventDefault();

      if (firstEditableColumn) {
        const currentRow = rows[selectedRowIndex];
        const value = String(currentRow[firstEditableColumn.field] ?? "");

        startCellEdit(selectedRowIndex, firstEditableColumn.id, value);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearSelectionAnchor();
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;

    if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
      return;
    }

    const text = event.clipboardData.getData("text/plain");

    if (!text) {
      return;
    }

    event.preventDefault();
    pasteSelection(text);
  };

  return (
    <div
      className="sg-grid-root"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    >
      {children}
    </div>
  );
}
