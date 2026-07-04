import { useEffect, useMemo, useRef, useState } from "react";
import type { Column } from "@gridnexa/core";
import { GridRow } from "../GridRow/GridRow";
import "./GridBody.css";

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

const ROW_HEIGHT = 42;
const OVERSCAN_ROWS = 8;

interface Props<T> {
  rows: DisplayRow<T>[];
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

export function GridBody<T>({
  rows,
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
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const element = bodyRef.current;

    if (!element) {
      return;
    }

    const syncViewport = () => {
      setViewportHeight(element.clientHeight);
    };

    syncViewport();

    const resizeObserver = new ResizeObserver(syncViewport);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const totalHeight = rows.length * ROW_HEIGHT;

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } =
    useMemo(() => {
      const visibleRows = Math.max(1, Math.ceil(viewportHeight / ROW_HEIGHT));
      const nextStartIndex = Math.max(
        0,
        Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS,
      );
      const nextEndIndex = Math.min(
        rows.length,
        nextStartIndex + visibleRows + OVERSCAN_ROWS * 2,
      );

      return {
        startIndex: nextStartIndex,
        endIndex: nextEndIndex,
        topSpacerHeight: nextStartIndex * ROW_HEIGHT,
        bottomSpacerHeight: Math.max(
          0,
          (rows.length - nextEndIndex) * ROW_HEIGHT,
        ),
      };
    }, [rows.length, scrollTop, viewportHeight]);

  const visibleRows = rows.slice(startIndex, endIndex);
  const getRowKey = (row: DisplayRow<T>) => {
    if (row.kind === "group" || row.kind === "pivot" || row.kind === "detail") {
      return `${row.kind}-${row.key}`;
    }

    const dataRow = row as DataRow<T>;

    return `row-${dataRow.rowIndex}-${dataRow.groupKey}`;
  };

  return (
    <div
      className="sg-body"
      ref={bodyRef}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: topSpacerHeight }} />
      {visibleRows.map((row) => (
        <GridRow
          key={getRowKey(row)}
          item={row}
          columns={columns}
          onToggleGroup={onToggleGroup}
          onToggleTreeNode={onToggleTreeNode}
          onToggleDetailRow={onToggleDetailRow}
          onReorderRow={onReorderRow}
          onMoveRow={onMoveRow}
          onResetRowDragState={onResetRowDragState}
          onSetDraggedRowIndex={onSetDraggedRowIndex}
          onSetDropTargetRowIndex={onSetDropTargetRowIndex}
        />
      ))}
      <div style={{ height: bottomSpacerHeight }} />
    </div>
  );
}
