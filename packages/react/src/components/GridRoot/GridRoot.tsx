import type { PropsWithChildren, Ref } from "react";
import { cx, useGridContext } from "../../context/GridContext";
import "./GridRoot.css";

interface GridRootProps extends PropsWithChildren {
  rootRef?: Ref<HTMLDivElement>;
}

export function GridRoot({ children, rootRef }: GridRootProps) {
  const {
    rows,
    columns,
    startCellEdit,
    activeCell,
    selectionAnchor,
    clearSelectionAnchor,
    copySelection,
    pasteSelection,
    moveActiveCell,
    getCellId,
    classNames,
    tableMinWidth,
    tableWidth,
    height,
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

    if ((event.ctrlKey || event.metaKey) && event.key === "Home") {
      event.preventDefault();
      moveActiveCell(-rows.length, -columns.length, event.shiftKey);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "End") {
      event.preventDefault();
      moveActiveCell(rows.length, columns.length, event.shiftKey);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveActiveCell(0, -columns.length, event.shiftKey);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveActiveCell(0, columns.length, event.shiftKey);
      return;
    }

    if (event.key === "PageDown") {
      event.preventDefault();
      moveActiveCell(10, 0, event.shiftKey);
      return;
    }

    if (event.key === "PageUp") {
      event.preventDefault();
      moveActiveCell(-10, 0, event.shiftKey);
      return;
    }

    if (
      (event.key === "Enter" || event.key === "F2") &&
      activeCell
    ) {
      event.preventDefault();

      const activeColumn = columns[activeCell.columnIndex] ?? firstEditableColumn;

      if (activeColumn?.editable !== false) {
        const currentRow = rows[activeCell.rowIndex];
        const value = String(currentRow?.[activeColumn.field] ?? "");

        startCellEdit(activeCell.rowIndex, activeColumn.id, value);
      }
      return;
    }

    if (
      activeCell &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const activeColumn = columns[activeCell.columnIndex];

      if (activeColumn?.editable !== false) {
        event.preventDefault();
        startCellEdit(activeCell.rowIndex, activeColumn.id, event.key);
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
      ref={rootRef}
      className={cx("sg-grid-root", classNames.gridRoot)}
      style={
        {
          "--gnx-table-min-width": `${tableMinWidth}px`,
          "--gnx-table-width": tableWidth,
          height: typeof height === "number" ? `${height}px` : height,
        } as React.CSSProperties
      }
      tabIndex={0}
      role="grid"
      aria-label="GridNexa data grid"
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
      aria-activedescendant={
        activeCell ? getCellId(activeCell.rowIndex, activeCell.columnIndex) : undefined
      }
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    >
      {children}
    </div>
  );
}
