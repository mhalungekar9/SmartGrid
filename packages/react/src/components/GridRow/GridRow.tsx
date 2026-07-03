import { useGridContext } from "../../context/GridContext";
import type { Column } from "@smartgrid/core";
import { GridCell } from "../GridCell/GridCell";

import "./GridRow.css";

type DataRow<T> = {
  kind: "data";
  row: T;
  rowIndex: number;
  groupKey: string;
};

type GroupRow<T> = {
  kind: "group";
  key: string;
  label: string;
  count: number;
  summaries: string;
};

type DisplayRow<T> = DataRow<T> | GroupRow<T>;

interface Props<T> {
  item: DisplayRow<T>;
  columns: Column<T>[];
  onToggleGroup: (groupKey: string) => void;
  onReorderRow: (sourceRowIndex: number, targetRowIndex: number) => void;
  onResetRowDragState: () => void;
  onSetDraggedRowIndex: (rowIndex: number | null) => void;
  onSetDropTargetRowIndex: (rowIndex: number | null) => void;
}

export function GridRow<T>({
  item,
  columns,
  onToggleGroup,
  onReorderRow,
  onResetRowDragState,
  onSetDraggedRowIndex,
  onSetDropTargetRowIndex,
}: Props<T>) {
  const { columnTemplate, selectedRowIndex, onRowSelect, dropTargetRowIndex } =
    useGridContext<T>();

  if (item.kind === "group") {
    return (
      <div
        className="sg-row sg-row--group"
        onClick={() => onToggleGroup(item.key)}
      >
        <div
          className="sg-group-row"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div
            className="sg-group-label"
            style={{ gridColumn: `1 / span ${columns.length}` }}
          >
            <span className="sg-group-toggle">▾</span>
            <span>{item.label}</span>
            <span className="sg-group-count">{item.count} rows</span>
            {item.summaries ? (
              <span className="sg-group-summary">{item.summaries}</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const { row, rowIndex } = item;
  const isSelected = selectedRowIndex === rowIndex;

  return (
    <div
      className={`sg-row sg-row--data${dropTargetRowIndex === rowIndex ? " sg-row--drop-target" : ""}`}
      data-selected={isSelected ? "true" : "false"}
      draggable
      onClick={() => onRowSelect(rowIndex)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(rowIndex));
        onSetDraggedRowIndex(rowIndex);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onSetDropTargetRowIndex(rowIndex);
      }}
      onDragLeave={() => {
        onSetDropTargetRowIndex(null);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceRowIndex = Number(event.dataTransfer.getData("text/plain"));

        if (!Number.isNaN(sourceRowIndex)) {
          onReorderRow(sourceRowIndex, rowIndex);
        }

        onResetRowDragState();
      }}
      onDragEnd={() => {
        onResetRowDragState();
      }}
      style={{
        gridTemplateColumns: columnTemplate,
      }}
    >
      {columns
        .filter((column) => !column.hidden)
        .map((column, columnIndex) => (
          <GridCell
            key={column.id}
            row={row}
            rowIndex={rowIndex}
            columnIndex={columnIndex}
            column={column}
          />
        ))}
    </div>
  );
}
