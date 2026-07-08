import { createElement, type ComponentType, type ReactNode } from "react";
import { cx, useGridContext } from "../../context/GridContext";
import type { Column } from "@gridnexa/core";
import { GridCell } from "../GridCell/GridCell";

import "./GridRow.css";

function renderIcon(icon: unknown, fallback: ReactNode) {
  if (!icon) {
    return fallback;
  }

  if (typeof icon === "function") {
    return createElement(icon as ComponentType<{ size?: number }>, {
      size: 14,
    });
  }

  return icon as ReactNode;
}

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
  onMoveRow: (rowIndex: number, direction: -1 | 1) => void;
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
  onMoveRow,
  onResetRowDragState,
  onSetDraggedRowIndex,
  onSetDropTargetRowIndex,
}: Props<T>) {
  const {
    columnTemplate,
    rows: contextRows,
    selectedRowIndex,
    selectedRowIds,
    checkboxSelection,
    getRowSelectionId,
    onRowSelect,
    emitRowDoubleClick,
    dropTargetRowIndex,
    rowNumbers,
    rowNumberOffset,
    toggleRowSelection,
    enableRowReorder,
    rowReorderPosition,
    classNames,
    getRowClassName,
    selectionColumnStyle,
    rowNumberColumnStyle,
    icons,
  } = useGridContext<T>();
  const leadingColumnCount = (checkboxSelection ? 1 : 0) + (rowNumbers ? 1 : 0);

  if (item.kind === "group" || item.kind === "pivot") {
    const isPivot = item.kind === "pivot";

    return (
      <div
        className={cx("sg-row sg-row--group", isPivot && "sg-row--pivot", classNames.row)}
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
              gridColumn: `1 / span ${columns.length + leadingColumnCount}`,
            }}
          >
            <span className="sg-group-toggle" aria-hidden="true">
              {isPivot ? "Pivot" : renderIcon(icons.treeCollapse, "v")}
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
      <div className={cx("sg-row sg-row--detail", classNames.row)} role="row">
        <div
          className="sg-detail-row"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div
            className="sg-detail-content"
            style={{
              gridColumn: `1 / span ${columns.length + leadingColumnCount}`,
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
  const displayRowNumber = rowNumberOffset + rowIndex + 1;
  const rowSelectionId = getRowSelectionId(row, rowIndex);
  const isSelected =
    selectedRowIndex === rowIndex || selectedRowIds.has(rowSelectionId);
  const rowReorderControls = (
    <span
      className={cx(
        "sg-row-reorder-controls",
        rowReorderPosition === "right" && "sg-row-reorder-controls--right",
      )}
      aria-label="Move row"
    >
      <button
        className="sg-row-reorder-button"
        type="button"
        title="Move row up"
        aria-label={`Move row ${displayRowNumber} up`}
        disabled={rowIndex === 0}
        onClick={(event) => {
          event.stopPropagation();
          onMoveRow(rowIndex, -1);
        }}
      >
        ^
      </button>
      <button
        className="sg-row-reorder-button"
        type="button"
        title="Move row down"
        aria-label={`Move row ${displayRowNumber} down`}
        disabled={rowIndex >= contextRows.length - 1}
        onClick={(event) => {
          event.stopPropagation();
          onMoveRow(rowIndex, 1);
        }}
      >
        v
      </button>
    </span>
  );
  const visibleColumns = columns.filter((column) => !column.hidden);

  return (
    <div
      className={cx(
        "sg-row sg-row--data",
        enableRowReorder && "sg-row--reorderable",
        dropTargetRowIndex === rowIndex && "sg-row--drop-target",
        classNames.row,
        getRowClassName({ row, rowIndex, selected: isSelected }),
      )}
      data-selected={isSelected ? "true" : "false"}
      role="row"
      aria-selected={isSelected}
      draggable={enableRowReorder}
      onClick={() => onRowSelect(rowIndex)}
      onDoubleClick={() => emitRowDoubleClick(rowIndex)}
      onDragStart={(event) => {
        if (!enableRowReorder) {
          event.preventDefault();
          return;
        }

        const target = event.target as HTMLElement | null;

        if (target?.closest("button, input, select, textarea")) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(rowIndex));
        onSetDraggedRowIndex(rowIndex);
      }}
      onDragOver={(event) => {
        if (!enableRowReorder) {
          return;
        }

        event.preventDefault();
        onSetDropTargetRowIndex(rowIndex);
      }}
      onDragLeave={() => {
        if (!enableRowReorder) {
          return;
        }

        onSetDropTargetRowIndex(null);
      }}
      onDrop={(event) => {
        if (!enableRowReorder) {
          return;
        }

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
      {checkboxSelection ? (
        <div
          className="sg-selection-cell"
          data-gnx-pinned="left"
          style={selectionColumnStyle}
        >
          <input
            className="sg-selection-checkbox"
            type="checkbox"
            checked={selectedRowIds.has(rowSelectionId)}
            aria-label={`Select row ${displayRowNumber}`}
            onChange={() => toggleRowSelection(row, rowIndex)}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
      {rowNumbers ? (
        <div
          className="sg-row-number"
          data-gnx-pinned="left"
          style={rowNumberColumnStyle}
        >
          {displayRowNumber}
        </div>
      ) : null}
      {visibleColumns
        .map((column, columnIndex) => {
          const isFirstColumn = columnIndex === 0;
          const isLastColumn = columnIndex === visibleColumns.length - 1;
          const treeAction =
            dataItem.hasChildren && dataItem.treeKey ? (
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
                {dataItem.expanded
                  ? renderIcon(icons.treeCollapse, "v")
                  : renderIcon(icons.treeExpand, ">")}
              </button>
            ) : dataItem.depth ? (
              <span
                className="sg-tree-indent"
                style={{ width: `${dataItem.depth * 16 + 24}px` }}
              />
            ) : undefined;
          const leadingAction = isFirstColumn ? (
            <>
              {enableRowReorder && rowReorderPosition === "left"
                ? rowReorderControls
                : null}
              {treeAction}
            </>
          ) : undefined;
          const trailingAction =
            enableRowReorder && rowReorderPosition === "right" && isLastColumn
              ? rowReorderControls
              : undefined;

          return (
            <GridCell
              key={column.id}
              row={row}
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              column={column}
              leadingAction={leadingAction}
              trailingAction={trailingAction}
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
                    {renderIcon(icons.detailExpand, "+")}
                  </button>
                ) : undefined
              }
            />
          );
        })}
    </div>
  );
}
