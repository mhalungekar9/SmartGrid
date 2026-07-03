import type { ReactNode } from "react";
import { useGridContext } from "../../context/GridContext";
import type { Column } from "@smartgrid/core";
import { GridCell } from "../GridCell/GridCell";

import "./GridRow.css";

type DataRow<T> = {
  kind: "data";
  row: T;
  rowIndex: number;
  groupKey: string;
  depth?: number;
  treeKey?: string;
  hasChildren?: boolean;
  expanded?: boolean;
  hasDetail?: boolean;
};

type GroupRow<T> = {
  kind: "group" | "pivot";
  key: string;
  label: string;
  count: number;
  summaries: string;
};

type DetailRow<T> = {
  kind: "detail";
  key: string;
  row: T;
  content: unknown;
};

type DisplayRow<T> = DataRow<T> | GroupRow<T> | DetailRow<T>;

interface Props<T> {
  item: DisplayRow<T>;
  columns: Column<T>[];
  onToggleGroup: (groupKey: string) => void;
  onToggleTreeNode: (treeKey: string) => void;
  onToggleDetailRow: (rowIndex: number) => void;
  onReorderRow: (sourceRowIndex: number, targetRowIndex: number) => void;
  onResetRowDragState: () => void;
  onSetDraggedRowIndex: (rowIndex: number | null) => void;
  onSetDropTargetRowIndex: (rowIndex: number | null) => void;
}

export function GridRow<T>({
  item,
  columns,
  onToggleGroup,
  onToggleTreeNode,
  onToggleDetailRow,
  onReorderRow,
  onResetRowDragState,
  onSetDraggedRowIndex,
  onSetDropTargetRowIndex,
}: Props<T>) {
  const {
    columnTemplate,
    selectedRowIndex,
    onRowSelect,
    dropTargetRowIndex,
    rowNumbers,
  } = useGridContext<T>();

  if (item.kind === "group" || item.kind === "pivot") {
    const isPivot = item.kind === "pivot";

    return (
      <div
        className={`sg-row sg-row--group${isPivot ? " sg-row--pivot" : ""}`}
        role="row"
        aria-expanded={isPivot ? undefined : true}
        onClick={() => {
          if (!isPivot) {
            onToggleGroup(item.key);
          }
        }}
      >
        <div
          className="sg-group-row"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div
            className="sg-group-label"
            style={{
              gridColumn: `1 / span ${columns.length + (rowNumbers ? 1 : 0)}`,
            }}
          >
            <span className="sg-group-toggle" aria-hidden="true">
              {isPivot ? "Pivot" : "v"}
            </span>
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

  if (item.kind === "detail") {
    return (
      <div className="sg-row sg-row--detail" role="row">
        <div
          className="sg-detail-row"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div
            className="sg-detail-content"
            style={{
              gridColumn: `1 / span ${columns.length + (rowNumbers ? 1 : 0)}`,
            }}
          >
            {item.content as ReactNode}
          </div>
        </div>
      </div>
    );
  }

  const dataItem = item as DataRow<T>;
  const { row, rowIndex } = dataItem;
  const isSelected = selectedRowIndex === rowIndex;

  return (
    <div
      className={`sg-row sg-row--data${dropTargetRowIndex === rowIndex ? " sg-row--drop-target" : ""}`}
      data-selected={isSelected ? "true" : "false"}
      role="row"
      aria-selected={isSelected}
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
      {rowNumbers ? <div className="sg-row-number">{rowIndex + 1}</div> : null}
      {columns
        .filter((column) => !column.hidden)
        .map((column, columnIndex) => {
          const isFirstColumn = columnIndex === 0;
          const leadingAction =
            isFirstColumn && dataItem.hasChildren && dataItem.treeKey ? (
              <button
                className="sg-tree-toggle"
                type="button"
                aria-label={`${dataItem.expanded ? "Collapse" : "Expand"} tree row`}
                aria-expanded={dataItem.expanded}
                style={{ marginLeft: `${(dataItem.depth ?? 0) * 16}px` }}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleTreeNode(dataItem.treeKey!);
                }}
              >
                {dataItem.expanded ? "v" : ">"}
              </button>
            ) : isFirstColumn && dataItem.depth ? (
              <span
                className="sg-tree-indent"
                style={{ width: `${dataItem.depth * 16 + 24}px` }}
              />
            ) : undefined;

          return (
            <GridCell
              key={column.id}
              row={row}
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              column={column}
              leadingAction={leadingAction}
              detailAction={
                isFirstColumn && dataItem.hasDetail ? (
                  <button
                    className="sg-detail-toggle"
                    type="button"
                    aria-label="Toggle detail row"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleDetailRow(rowIndex);
                    }}
                  >
                    +
                  </button>
                ) : undefined
              }
            />
          );
        })}
    </div>
  );
}
