import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { GridOptions } from "@smartgrid/core";

import { GridRoot } from "../GridRoot/GridRoot";
import { GridHeader } from "../GridHeader/GridHeader";
import { GridBody } from "../GridBody/GridBody";

import { GridRenderer } from "../../rendering";

import GridContext from "../../context/GridContext";
import type { Column } from "@smartgrid/core";

export interface SmartGridProps<T> extends GridOptions<T> {}

export interface SmartGridExtendedProps<T> extends GridOptions<T> {
  groupBy?: keyof T & string;
  pageSize?: number;
}

type SortDirection = "asc" | "desc";

interface SortModel {
  columnId: string;
  direction: SortDirection;
}

interface EditingCellState {
  rowIndex: number;
  columnId: string;
  draftValue: string;
}

interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

interface GroupBucket<T> {
  key: string;
  label: string;
  items: T[];
  summaries: string;
}

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

function getColumnValue<T>(
  row: T,
  column: GridOptions<T>["columns"][number],
): unknown {
  return column.valueGetter?.(row) ?? row[column.field];
}

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return -1;
  }

  if (right == null) {
    return 1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function sortRows<T>(
  rows: T[],
  columns: GridOptions<T>["columns"],
  sortModel: SortModel | null,
): T[] {
  if (!sortModel) {
    return rows;
  }

  const column = columns.find((entry) => entry.id === sortModel.columnId);

  if (!column) {
    return rows;
  }

  return [...rows].sort((leftRow, rightRow) => {
    const comparison = compareValues(
      getColumnValue(leftRow, column),
      getColumnValue(rightRow, column),
    );

    return sortModel.direction === "asc" ? comparison : -comparison;
  });
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildGroupSummaries<T>(
  items: T[],
  columns: Column<T>[],
  groupBy?: keyof T & string,
): string {
  const metrics = columns
    .filter((column) => !column.hidden && column.id !== groupBy)
    .map((column) => {
      const values = items
        .map((row) => getColumnValue(row, column))
        .filter((value): value is number => typeof value === "number");

      if (values.length === 0) {
        return null;
      }

      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;

      return `${column.headerName} avg ${formatNumber(average)}`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 2);

  return metrics.join(" · ");
}

function buildGroupBuckets<T>(
  rows: T[],
  columns: Column<T>[],
  groupBy?: keyof T & string,
): GroupBucket<T>[] {
  if (!groupBy) {
    return [];
  }

  const buckets = new Map<string, { label: string; items: T[] }>();

  rows.forEach((row) => {
    const rawValue = row[groupBy];
    const key = String(rawValue ?? "Ungrouped");
    const bucket = buckets.get(key) ?? { label: key, items: [] };

    bucket.items.push(row);
    buckets.set(key, bucket);
  });

  return Array.from(buckets.entries()).map(([key, bucket]) => ({
    key,
    label: bucket.label,
    items: bucket.items,
    summaries: buildGroupSummaries(bucket.items, columns, groupBy),
  }));
}

export function SmartGrid<T>({
  rows,
  columns,
  groupBy,
  pageSize,
}: SmartGridExtendedProps<T>) {
  const [gridRows, setGridRows] = useState(rows);
  const [columnWidths, setColumnWidths] = useState(() =>
    columns.map((column) => column.width ?? 150),
  );
  const [sortModel, setSortModel] = useState<SortModel | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [activeCell, setActiveCellState] = useState<CellPosition | null>(null);
  const [selectionAnchor, setSelectionAnchorState] =
    useState<CellPosition | null>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dropTargetRowIndex, setDropTargetRowIndex] = useState<number | null>(
    null,
  );
  const [hiddenColumnIds, setHiddenColumnIds] = useState<Set<string>>(
    () =>
      new Set(
        columns.filter((column) => column.hidden).map((column) => column.id),
      ),
  );
  const [columnChooserOpen, setColumnChooserOpen] = useState(false);
  const chooserRef = useRef<HTMLDivElement | null>(null);
  const resizeSession = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    setGridRows(rows);
  }, [rows]);

  const columnSignature = columns
    .map(
      (column) =>
        `${column.id}:${column.hidden ? 1 : 0}:${column.pinned ?? ""}`,
    )
    .join("|");

  useEffect(() => {
    setColumnWidths(columns.map((column) => column.width ?? 150));
    setSortModel(null);
    setSelectedRowIndex(null);
    setActiveCellState(null);
    setSelectionAnchorState(null);
    setCollapsedGroups(new Set());
    setPageIndex(0);
    setDraggedRowIndex(null);
    setDropTargetRowIndex(null);
    setHiddenColumnIds(
      new Set(
        columns.filter((column) => column.hidden).map((column) => column.id),
      ),
    );
    setColumnChooserOpen(false);
  }, [columnSignature]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumnIds.has(column.id)),
    [columns, hiddenColumnIds],
  );

  const orderedColumns = useMemo(() => {
    const pinnedLeft = visibleColumns.filter(
      (column) => column.pinned === "left",
    );
    const pinnedRight = visibleColumns.filter(
      (column) => column.pinned === "right",
    );
    const center = visibleColumns.filter((column) => !column.pinned);

    return [...pinnedLeft, ...center, ...pinnedRight];
  }, [visibleColumns]);

  const orderedWidths = orderedColumns.map((column, index) => {
    const originalIndex = columns.findIndex((entry) => entry.id === column.id);

    return (
      columnWidths[originalIndex] ?? column.width ?? columnWidths[index] ?? 150
    );
  });

  const columnStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    let leftOffset = 0;

    orderedColumns.forEach((column, index) => {
      const width = orderedWidths[index] ?? 150;

      if (column.pinned === "left") {
        styles[column.id] = {
          position: "sticky",
          left: leftOffset,
          zIndex: 3,
          background: "rgba(8, 12, 24, 0.98)",
          boxShadow: "inset -1px 0 0 rgba(255, 255, 255, 0.08)",
        };

        leftOffset += width;
      }
    });

    let rightOffset = 0;

    for (let index = orderedColumns.length - 1; index >= 0; index -= 1) {
      const column = orderedColumns[index];
      const width = orderedWidths[index] ?? 150;

      if (column.pinned === "right") {
        styles[column.id] = {
          ...styles[column.id],
          position: "sticky",
          right: rightOffset,
          zIndex: 3,
          background: "rgba(8, 12, 24, 0.98)",
          boxShadow: "inset 1px 0 0 rgba(255, 255, 255, 0.08)",
        };

        rightOffset += width;
      }
    }

    return styles;
  }, [orderedColumns, orderedWidths]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeSession.current) {
        return;
      }

      const { columnId, startX, startWidth } = resizeSession.current;
      const nextWidth = Math.max(60, startWidth + (event.clientX - startX));

      setColumnWidths((currentWidths) =>
        currentWidths.map((width, index) =>
          columns[index]?.id === columnId ? nextWidth : width,
        ),
      );
    };

    const handlePointerUp = () => {
      resizeSession.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [columns]);

  const resolvedRows = useMemo(
    () => sortRows(gridRows, columns, sortModel),
    [gridRows, columns, sortModel],
  );

  const filteredRows = useMemo(() => {
    const query = quickFilterText.trim().toLowerCase();

    if (!query) {
      return resolvedRows;
    }

    return resolvedRows.filter((row) =>
      orderedColumns.some((column) => {
        const value = getColumnValue(row, column);

        return String(value ?? "")
          .toLowerCase()
          .includes(query);
      }),
    );
  }, [resolvedRows, orderedColumns, quickFilterText]);

  const pagedRows = useMemo(() => {
    if (!pageSize || pageSize <= 0) {
      return filteredRows;
    }

    const start = pageIndex * pageSize;

    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);

  const pageCount =
    pageSize && pageSize > 0
      ? Math.max(1, Math.ceil(filteredRows.length / pageSize))
      : 1;

  const groupBuckets = useMemo(
    () => buildGroupBuckets(pagedRows, orderedColumns, groupBy),
    [pagedRows, orderedColumns, groupBy],
  );

  const visibleDataRows = useMemo(() => {
    if (!groupBy) {
      return pagedRows;
    }

    const dataRows: T[] = [];

    groupBuckets.forEach((bucket) => {
      if (collapsedGroups.has(bucket.key)) {
        return;
      }

      dataRows.push(...bucket.items);
    });

    return dataRows;
  }, [pagedRows, groupBuckets, groupBy, collapsedGroups]);

  const displayRows = useMemo<DisplayRow<T>[]>(() => {
    if (!groupBy) {
      return visibleDataRows.map((row, rowIndex) => ({
        kind: "data",
        row,
        rowIndex,
        groupKey: "",
      }));
    }

    const nextRows: DisplayRow<T>[] = [];
    let dataRowIndex = 0;

    groupBuckets.forEach((bucket) => {
      nextRows.push({
        kind: "group",
        key: bucket.key,
        label: bucket.label,
        count: bucket.items.length,
        summaries: bucket.summaries,
      });

      if (collapsedGroups.has(bucket.key)) {
        return;
      }

      bucket.items.forEach((row) => {
        nextRows.push({
          kind: "data",
          row,
          rowIndex: dataRowIndex,
          groupKey: bucket.key,
        });

        dataRowIndex += 1;
      });
    });

    return nextRows;
  }, [collapsedGroups, groupBy, groupBuckets, visibleDataRows]);

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);

      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      return next;
    });
  };

  const resetRowDragState = () => {
    setDraggedRowIndex(null);
    setDropTargetRowIndex(null);
  };

  const findRowIndex = (row: T) => gridRows.findIndex((entry) => entry === row);

  const reorderVisibleRows = (
    sourceRowIndex: number,
    targetRowIndex: number,
  ) => {
    if (sourceRowIndex === targetRowIndex) {
      return;
    }

    const sourceRow = visibleDataRows[sourceRowIndex];
    const targetRow = visibleDataRows[targetRowIndex];

    if (!sourceRow || !targetRow) {
      return;
    }

    const sourceOriginalIndex = findRowIndex(sourceRow);
    const targetOriginalIndex = findRowIndex(targetRow);

    if (sourceOriginalIndex < 0 || targetOriginalIndex < 0) {
      return;
    }

    setGridRows((currentRows) => {
      const nextRows = [...currentRows];
      const [movedRow] = nextRows.splice(sourceOriginalIndex, 1);

      let insertIndex = targetOriginalIndex;

      if (sourceOriginalIndex < targetOriginalIndex) {
        insertIndex -= 1;
      }

      nextRows.splice(insertIndex, 0, movedRow);

      return nextRows;
    });
  };

  useEffect(() => {
    if (selectedRowIndex == null) {
      return;
    }

    if (visibleDataRows.length === 0) {
      setSelectedRowIndex(null);
      return;
    }

    if (selectedRowIndex >= visibleDataRows.length) {
      setSelectedRowIndex(visibleDataRows.length - 1);
    }
  }, [selectedRowIndex, visibleDataRows.length]);

  useEffect(() => {
    if (!pageSize || pageSize <= 0) {
      return;
    }

    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex, pageSize]);

  useEffect(() => {
    if (!activeCell) {
      return;
    }

    if (
      activeCell.rowIndex >= visibleDataRows.length ||
      orderedColumns.length === 0
    ) {
      setActiveCellState(null);
      setSelectionAnchorState(null);
      return;
    }

    if (activeCell.columnIndex >= orderedColumns.length) {
      setActiveCellState({
        rowIndex: activeCell.rowIndex,
        columnIndex: orderedColumns.length - 1,
      });
    }
  }, [activeCell, orderedColumns.length, visibleDataRows.length]);

  const renderer = useMemo(
    () => new GridRenderer(orderedColumns, orderedWidths),
    [orderedColumns, orderedWidths],
  );
  const template = renderer.getTemplate();

  const getCellRange = () => {
    if (!activeCell || !selectionAnchor) {
      return null;
    }

    return {
      startRow: Math.min(activeCell.rowIndex, selectionAnchor.rowIndex),
      endRow: Math.max(activeCell.rowIndex, selectionAnchor.rowIndex),
      startColumn: Math.min(
        activeCell.columnIndex,
        selectionAnchor.columnIndex,
      ),
      endColumn: Math.max(activeCell.columnIndex, selectionAnchor.columnIndex),
    };
  };

  const cellRange = getCellRange();

  const parsePastedValue = (rawValue: string, currentValue: unknown) => {
    if (typeof currentValue === "number") {
      const parsed = Number(rawValue);

      return Number.isNaN(parsed) ? currentValue : parsed;
    }

    return rawValue;
  };

  const copySelection = async () => {
    const cellToText = (rowIndex: number, columnIndex: number) => {
      const row = visibleDataRows[rowIndex];
      const column = orderedColumns[columnIndex];

      if (!row || !column) {
        return "";
      }

      const value = getColumnValue(row, column);

      return column.valueFormatter
        ? column.valueFormatter(value)
        : String(value ?? "");
    };

    let text = "";

    if (cellRange) {
      const lines: string[] = [];

      for (
        let rowIndex = cellRange.startRow;
        rowIndex <= cellRange.endRow;
        rowIndex += 1
      ) {
        const values: string[] = [];

        for (
          let columnIndex = cellRange.startColumn;
          columnIndex <= cellRange.endColumn;
          columnIndex += 1
        ) {
          values.push(cellToText(rowIndex, columnIndex));
        }

        lines.push(values.join("\t"));
      }

      text = lines.join("\n");
    } else if (activeCell) {
      text = cellToText(activeCell.rowIndex, activeCell.columnIndex);
    }

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
  };

  const exportVisibleRowsToCsv = () => {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const headerLine = orderedColumns
      .map((column) => escapeCsv(column.headerName))
      .join(",");
    const dataLines = visibleDataRows.map((row) =>
      orderedColumns
        .map((column) => escapeCsv(getColumnValue(row, column)))
        .join(","),
    );

    const csv = [headerLine, ...dataLines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "smartgrid-export.csv";
    link.click();

    URL.revokeObjectURL(downloadUrl);
  };

  const pasteSelection = (text: string) => {
    const source = text.replace(/\r\n/g, "\n");
    const rowsToPaste = source.split("\n").map((line) => line.split("\t"));

    if (
      rowsToPaste.length === 0 ||
      rowsToPaste.every((line) => line.length === 0)
    ) {
      return;
    }

    const startRow = activeCell?.rowIndex ?? selectedRowIndex ?? 0;
    const startColumn = activeCell?.columnIndex ?? 0;

    const targetRows: Array<[number, number, string]> = [];

    if (cellRange && rowsToPaste.length === 1 && rowsToPaste[0].length === 1) {
      for (
        let rowOffset = 0;
        rowOffset <= cellRange.endRow - cellRange.startRow;
        rowOffset += 1
      ) {
        for (
          let columnOffset = 0;
          columnOffset <= cellRange.endColumn - cellRange.startColumn;
          columnOffset += 1
        ) {
          targetRows.push([
            cellRange.startRow + rowOffset,
            cellRange.startColumn + columnOffset,
            rowsToPaste[0][0],
          ]);
        }
      }
    } else {
      rowsToPaste.forEach((line, rowOffset) => {
        line.forEach((value, columnOffset) => {
          targetRows.push([
            startRow + rowOffset,
            startColumn + columnOffset,
            value,
          ]);
        });
      });
    }

    setGridRows((currentRows) => {
      const nextRows = [...currentRows];
      const updates = new Map<number, Record<string, unknown>>();

      for (const [viewRowIndex, viewColumnIndex, rawValue] of targetRows) {
        const row = visibleDataRows[viewRowIndex];
        const column = orderedColumns[viewColumnIndex];

        if (!row || !column || column.editable === false) {
          continue;
        }

        const originalIndex = findRowIndex(row);

        if (originalIndex < 0) {
          continue;
        }

        const currentValue = nextRows[originalIndex][column.field];
        const existingUpdate = updates.get(originalIndex) ?? {};

        existingUpdate[column.field] = parsePastedValue(rawValue, currentValue);
        updates.set(originalIndex, existingUpdate);
      }

      updates.forEach((update, index) => {
        nextRows[index] = {
          ...nextRows[index],
          ...update,
        };
      });

      return nextRows;
    });
  };

  const commitCellEdit = () => {
    if (!editingCell) {
      return;
    }

    const column = columns.find((entry) => entry.id === editingCell.columnId);

    if (!column || column.editable === false) {
      setEditingCell(null);
      return;
    }

    const row = visibleDataRows[editingCell.rowIndex];

    if (!row) {
      setEditingCell(null);
      return;
    }

    const originalIndex = gridRows.findIndex((entry) => entry === row);

    if (originalIndex < 0) {
      setEditingCell(null);
      return;
    }

    const parsedValue =
      typeof row[column.field] === "number"
        ? Number(editingCell.draftValue)
        : editingCell.draftValue;

    setGridRows((currentRows) =>
      currentRows.map((entry, index) => {
        if (index !== originalIndex) {
          return entry;
        }

        return {
          ...entry,
          [column.field]: parsedValue,
        };
      }),
    );

    setEditingCell(null);
  };

  const startCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const column = columns.find((entry) => entry.id === columnId);

    if (!column || column.editable === false) {
      return;
    }

    setEditingCell({
      rowIndex,
      columnId,
      draftValue: value,
    });
  };

  const handleSort = (columnId: string) => {
    const column = columns.find((entry) => entry.id === columnId);

    if (!column || column.sortable === false) {
      return;
    }

    setSortModel((currentSort) => {
      if (currentSort?.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }

      if (currentSort.direction === "asc") {
        return { columnId, direction: "desc" };
      }

      return null;
    });
  };

  const handleResizeStart = (
    columnId: string,
    startWidth: number,
    startX: number,
  ) => {
    resizeSession.current = { columnId, startX, startWidth };
  };

  const autoSizeColumn = (columnId: string) => {
    const column = columns.find((entry) => entry.id === columnId);

    if (!column) {
      return;
    }

    const headerWidth = column.headerName.length * 10 + 40;
    const contentWidth = filteredRows.reduce((maxWidth, row) => {
      const value = getColumnValue(row, column);
      const cellWidth =
        String(
          column.valueFormatter ? column.valueFormatter(value) : (value ?? ""),
        ).length *
          9 +
        32;

      return Math.max(maxWidth, cellWidth);
    }, headerWidth);

    const nextWidth = Math.max(
      column.minWidth ?? 60,
      Math.min(column.maxWidth ?? 1000, contentWidth),
    );
    const originalIndex = columns.findIndex((entry) => entry.id === columnId);

    if (originalIndex < 0) {
      return;
    }

    setColumnWidths((currentWidths) =>
      currentWidths.map((width, index) =>
        index === originalIndex ? nextWidth : width,
      ),
    );
  };

  const setActiveCell = (rowIndex: number, columnIndex: number) => {
    setActiveCellState({ rowIndex, columnIndex });
    setSelectedRowIndex(rowIndex);
  };

  const setSelectionAnchor = (rowIndex: number, columnIndex: number) => {
    setSelectionAnchorState({ rowIndex, columnIndex });
    setActiveCellState({ rowIndex, columnIndex });
    setSelectedRowIndex(rowIndex);
  };

  const clearSelectionAnchor = () => {
    setSelectionAnchorState(null);
  };

  const moveActiveCell = (
    rowDelta: number,
    columnDelta: number,
    extend = false,
  ) => {
    if (!orderedColumns.length || !filteredRows.length) {
      return;
    }

    const current = activeCell ?? {
      rowIndex: selectedRowIndex ?? 0,
      columnIndex: 0,
    };

    const nextRowIndex = Math.max(
      0,
      Math.min(filteredRows.length - 1, current.rowIndex + rowDelta),
    );
    const nextColumnIndex = Math.max(
      0,
      Math.min(orderedColumns.length - 1, current.columnIndex + columnDelta),
    );
    const nextCell = { rowIndex: nextRowIndex, columnIndex: nextColumnIndex };

    setActiveCellState(nextCell);
    setSelectedRowIndex(nextRowIndex);

    if (extend) {
      setSelectionAnchorState((currentAnchor) => currentAnchor ?? current);
      return;
    }

    setSelectionAnchorState(nextCell);
  };

  const goToPreviousPage = () => {
    setPageIndex((current) => Math.max(0, current - 1));
    setSelectedRowIndex(null);
    setActiveCellState(null);
    setSelectionAnchorState(null);
  };

  const goToNextPage = () => {
    setPageIndex((current) => Math.min(pageCount - 1, current + 1));
    setSelectedRowIndex(null);
    setActiveCellState(null);
    setSelectionAnchorState(null);
  };

  const rowCountLabel = `${visibleDataRows.length} of ${filteredRows.length} rows shown`;
  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumnIds((current) => {
      const next = new Set(current);

      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }

      return next;
    });

    setPageIndex(0);
    setSelectedRowIndex(null);
    setActiveCellState(null);
    setSelectionAnchorState(null);
  };

  return (
    <GridContext.Provider
      value={{
        rows: visibleDataRows,
        columns: orderedColumns,
        columnTemplate: template,
        selectedRowIndex,
        onRowSelect: setSelectedRowIndex,
        getColumnStyle: (columnId: string) => columnStyles[columnId] ?? {},
        activeCell,
        selectionAnchor,
        setActiveCell,
        setSelectionAnchor,
        moveActiveCell,
        clearSelectionAnchor,
        copySelection,
        pasteSelection,
        draggedRowIndex,
        dropTargetRowIndex,
        editingCell,
        startCellEdit,
        updateCellDraft: (value: string) => {
          setEditingCell((current) =>
            current ? { ...current, draftValue: value } : current,
          );
        },
        commitCellEdit,
        cancelCellEdit: () => setEditingCell(null),
      }}
    >
      <div className="sg-shell">
        <div className="sg-toolbar">
          <div className="sg-toolbar-copy">
            <div className="sg-toolbar-title">SmartGrid</div>
            <div className="sg-toolbar-subtitle">{rowCountLabel}</div>
          </div>

          <div className="sg-toolbar-actions">
            {pageSize && pageSize > 0 ? (
              <div className="sg-pager">
                <button
                  className="sg-toolbar-button sg-toolbar-button--ghost"
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={pageIndex === 0}
                >
                  Prev
                </button>
                <span className="sg-pager-status">
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <button
                  className="sg-toolbar-button sg-toolbar-button--ghost"
                  type="button"
                  onClick={goToNextPage}
                  disabled={pageIndex >= pageCount - 1}
                >
                  Next
                </button>
              </div>
            ) : null}

            <label className="sg-filter">
              <span className="sg-filter-label">Quick filter</span>
              <input
                className="sg-filter-input"
                type="search"
                value={quickFilterText}
                onChange={(event) => setQuickFilterText(event.target.value)}
                placeholder="Search across visible columns"
              />
            </label>

            <div className="sg-column-chooser" ref={chooserRef}>
              <button
                className="sg-toolbar-button sg-toolbar-button--ghost"
                type="button"
                onClick={() => setColumnChooserOpen((current) => !current)}
                aria-expanded={columnChooserOpen}
                aria-haspopup="menu"
              >
                Columns
              </button>

              {columnChooserOpen ? (
                <div
                  className="sg-column-chooser-panel"
                  role="menu"
                  aria-label="Column chooser"
                >
                  {columns.map((column) => {
                    const isHidden = hiddenColumnIds.has(column.id);

                    return (
                      <label className="sg-column-chooser-item" key={column.id}>
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={() => toggleColumnVisibility(column.id)}
                        />
                        <span className="sg-column-chooser-label">
                          {column.headerName}
                        </span>
                        {column.pinned ? (
                          <span className="sg-column-chooser-meta">
                            {column.pinned}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <button
              className="sg-toolbar-button"
              type="button"
              onClick={exportVisibleRowsToCsv}
            >
              Export CSV
            </button>
          </div>
        </div>

        <GridRoot>
          <GridHeader
            columns={orderedColumns}
            widths={orderedWidths}
            sortModel={sortModel}
            onSort={handleSort}
            onResizeStart={handleResizeStart}
            onAutoSize={autoSizeColumn}
          />
          <GridBody
            rows={displayRows}
            columns={orderedColumns}
            onToggleGroup={toggleGroup}
            onReorderRow={reorderVisibleRows}
            onResetRowDragState={resetRowDragState}
            onSetDraggedRowIndex={setDraggedRowIndex}
            onSetDropTargetRowIndex={setDropTargetRowIndex}
          />
        </GridRoot>
      </div>
    </GridContext.Provider>
  );
}
