import { useEffect, useInsertionEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactElement } from "react";
import type {
  AdvancedFilterModel,
  ColumnFilterModel,
  GridOptions,
  GridNexaSlotClassNames,
  GridNexaAiRequest,
  GridNexaCommandAction,
  GridNexaCommandPlan,
  PivotAggregation,
} from "@gridnexa/core";

import { GridRoot } from "../GridRoot/GridRoot";
import { GridHeader } from "../GridHeader/GridHeader";
import { GridBody } from "../GridBody/GridBody";

import { GridRenderer } from "../../rendering";

import GridContext, { cx } from "../../context/GridContext";
import { injectGridNexaStyles } from "../../styles/injectGridNexaStyles";
import { getColumnValue, getRawColumnValue } from "../../utils/cellValue";
import type { Column } from "@gridnexa/core";

export interface GridNexaProps<T> extends GridOptions<T> {}

type GridNexaRowsChangeReason =
  | "edit"
  | "fill"
  | "paste"
  | "clear"
  | "rowReorder"
  | "transaction"
  | "undo"
  | "redo";

interface GridNexaEventProps<T> {
  onGridReady?: (params: { rows: T[]; columns: Column<T>[] }) => void;
  onRowsChange?: (params: {
    rows: T[];
    previousRows: T[];
    reason: GridNexaRowsChangeReason;
  }) => void;
  onSaveAll?: (params: {
    rows: T[];
    selectedRows: T[];
    visibleRows: T[];
    reason: "toolbar" | "api";
  }) => void;
  onRowClick?: (params: { row: T; rowIndex: number }) => void;
  onRowDoubleClick?: (params: { row: T; rowIndex: number }) => void;
  onRowSelected?: (params: {
    row: T;
    rowIndex: number;
    selected: boolean;
    selectedRows: T[];
  }) => void;
  onSelectedRowChange?: (params: {
    row: T | null;
    rowIndex: number | null;
    selectedRows: T[];
  }) => void;
  onSelectionChanged?: (params: {
    selectedRows: T[];
    selectedRowIds: Array<string | number>;
  }) => void;
  onRowOrderChange?: (params: {
    rows: T[];
    movedRow: T;
    sourceIndex: number;
    targetIndex: number;
  }) => void;
  onRowDragStart?: (params: { row: T; rowIndex: number }) => void;
  onRowDragEnd?: (params: { row: T | null; rowIndex: number | null }) => void;
  onCellClick?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    columnIndex: number;
    value: unknown;
  }) => void;
  onCellDoubleClick?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    columnIndex: number;
    value: unknown;
  }) => void;
  onCellEditStart?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    value: unknown;
  }) => void;
  onCellEditStop?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    oldValue: unknown;
    newValue: unknown;
  }) => void;
  onRangeSelectionChange?: (range: {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
  } | null) => void;
  onSortModelChange?: (
    model: Array<{ columnId: string; direction: "asc" | "desc" }>,
  ) => void;
  onSortChanged?: (
    model: Array<{ columnId: string; direction: "asc" | "desc" }>,
  ) => void;
  onFilterModelChange?: (model: Record<string, ColumnFilterModel>) => void;
  onFilterChanged?: (model: Record<string, ColumnFilterModel>) => void;
  onQuickFilterChange?: (value: string) => void;
  onPageChange?: (params: { pageIndex: number; pageSize?: number }) => void;
  onColumnOrderChange?: (columnIds: string[]) => void;
  onColumnMoved?: (params: {
    columnId: string;
    sourceIndex: number;
    targetIndex: number;
    columnIds: string[];
  }) => void;
  onColumnResize?: (params: { columnId: string; width: number }) => void;
  onColumnResized?: (params: { columnId: string; width: number }) => void;
  onColumnVisibilityChange?: (params: {
    columnId: string;
    hidden: boolean;
    hiddenColumnIds: string[];
  }) => void;
  onColumnVisible?: (params: {
    columnId: string;
    visible: boolean;
    hiddenColumnIds: string[];
  }) => void;
  onColumnPin?: (params: {
    columnId: string;
    pinned: "left" | "right" | null;
  }) => void;
  onColumnPinned?: (params: {
    columnId: string;
    pinned: "left" | "right" | null;
  }) => void;
  onCopy?: (params: {
    text: string;
    range: {
      startRow: number;
      endRow: number;
      startColumn: number;
      endColumn: number;
    } | null;
  }) => void;
  onPaste?: (params: { text: string }) => void;
  onFill?: (params: {
    range: {
      startRow: number;
      endRow: number;
      startColumn: number;
      endColumn: number;
    };
    value: unknown;
  }) => void;
  onExport?: (params: { format: "csv" | "excel"; rows: T[] }) => void;
}

export interface GridNexaExtendedProps<T>
  extends Omit<GridOptions<T>, "toolbar">,
    GridNexaEventProps<T> {
  groupBy?: keyof T & string;
  pageSize?: number;
  toolbar?: GridOptions<T>["toolbar"] | (Record<string, boolean> & { saveAll?: boolean });
  rowReorderPosition?: "left" | "right";
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

interface CellContextMenuState extends CellPosition {
  x: number;
  y: number;
}

interface GroupBucket<T> {
  key: string;
  label: string;
  items: T[];
  summaries: string;
}

interface PivotResult<T> {
  active: boolean;
  columns: Column<T>[];
  rows: T[];
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

function getFilterType(filter: ColumnFilterModel): ColumnFilterModel["type"] {
  return filter.type ?? "text";
}

function isFilterActive(filter: ColumnFilterModel): boolean {
  if (getFilterType(filter) === "multi") {
    return Boolean(filter.conditions?.some(isFilterActive));
  }

  if (filter.operator === "blank" || filter.operator === "notBlank") {
    return true;
  }

  if (getFilterType(filter) === "set") {
    return Boolean(filter.values?.length);
  }

  return filter.value != null && String(filter.value).trim() !== "";
}

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

function parseDateValue(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = Date.parse(String(value ?? ""));

  return Number.isNaN(parsed) ? null : parsed;
}

function matchesColumnFilter<T>(
  row: T,
  column: Column<T>,
  filter: ColumnFilterModel,
): boolean {
  if (getFilterType(filter) === "multi") {
    const conditions = filter.conditions ?? [];

    if (!conditions.length) {
      return true;
    }

    return filter.joinOperator === "or"
      ? conditions.some((condition) =>
          matchesColumnFilter(row, column, condition),
        )
      : conditions.every((condition) =>
          matchesColumnFilter(row, column, condition),
        );
  }

  const value = getColumnValue(row, column);
  const configuredFilter =
    typeof column.filter === "object" ? column.filter : undefined;

  if (configuredFilter?.predicate) {
    return configuredFilter.predicate(value, row, filter.value);
  }

  if (filter.operator === "blank") {
    return isBlank(value);
  }

  if (filter.operator === "notBlank") {
    return !isBlank(value);
  }

  if (getFilterType(filter) === "set") {
    const values = filter.values ?? [];

    return values.map(String).includes(String(value ?? ""));
  }

  if (getFilterType(filter) === "number") {
    const numericValue = Number(value);
    const filterValue = Number(filter.value);
    const filterValueTo = Number(filter.valueTo);

    if (Number.isNaN(numericValue) || Number.isNaN(filterValue)) {
      return false;
    }

    if (filter.operator === "gt") return numericValue > filterValue;
    if (filter.operator === "gte") return numericValue >= filterValue;
    if (filter.operator === "lt") return numericValue < filterValue;
    if (filter.operator === "lte") return numericValue <= filterValue;
    if (filter.operator === "between") {
      return (
        !Number.isNaN(filterValueTo) &&
        numericValue >= filterValue &&
        numericValue <= filterValueTo
      );
    }

    return numericValue === filterValue;
  }

  if (getFilterType(filter) === "date") {
    const dateValue = parseDateValue(value);
    const filterValue = parseDateValue(filter.value);
    const filterValueTo = parseDateValue(filter.valueTo);

    if (dateValue == null || filterValue == null) {
      return false;
    }

    if (filter.operator === "before") return dateValue < filterValue;
    if (filter.operator === "after") return dateValue > filterValue;
    if (filter.operator === "between") {
      return (
        filterValueTo != null &&
        dateValue >= filterValue &&
        dateValue <= filterValueTo
      );
    }

    return (
      new Date(dateValue).toDateString() ===
      new Date(filterValue).toDateString()
    );
  }

  const text = String(value ?? "").toLowerCase();
  const filterText = String(filter.value ?? "").toLowerCase();

  if (!filterText) {
    return true;
  }

  if (filter.operator === "equals") return text === filterText;
  if (filter.operator === "startsWith") return text.startsWith(filterText);
  if (filter.operator === "endsWith") return text.endsWith(filterText);

  return text.includes(filterText);
}

function getColumnFilterType<T>(column: Column<T>): ColumnFilterModel["type"] {
  if (typeof column.filter === "string") {
    return column.filter === "multi" ? "text" : column.filter;
  }

  if (column.filter?.type) {
    return column.filter.type === "multi" ? "text" : column.filter.type;
  }

  return "text";
}

function getFilterOperatorOptions(
  filterType: ColumnFilterModel["type"],
): ColumnFilterModel["operator"][] {
  if (filterType === "number") {
    return ["equals", "gt", "gte", "lt", "lte", "between", "blank", "notBlank"];
  }

  if (filterType === "date") {
    return ["equals", "before", "after", "between", "blank", "notBlank"];
  }

  if (filterType === "set") {
    return ["in", "blank", "notBlank"];
  }

  return ["contains", "equals", "startsWith", "endsWith", "blank", "notBlank"];
}

function createAdvancedFilterRule<T>(
  columns: Column<T>[],
): AdvancedFilterModel {
  const firstColumn =
    columns.find((column) => column.filterable !== false) ?? columns[0];
  const filterType = firstColumn ? getColumnFilterType(firstColumn) : "text";

  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind: "rule",
    columnId: firstColumn?.id ?? "",
    operator:
      filterType === "set"
        ? "in"
        : filterType === "number" || filterType === "date"
          ? "equals"
          : "contains",
    value: "",
  };
}

function createAdvancedFilterGroup<T>(
  columns: Column<T>[],
): AdvancedFilterModel {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind: "group",
    joinOperator: "and",
    conditions: [createAdvancedFilterRule(columns)],
  };
}

function isAdvancedFilterActive(model: AdvancedFilterModel | null): boolean {
  if (!model) {
    return false;
  }

  if (model.kind === "group") {
    return model.conditions.some(isAdvancedFilterActive);
  }

  if (model.operator === "blank" || model.operator === "notBlank") {
    return true;
  }

  if (model.operator === "in") {
    return Boolean(model.values?.length);
  }

  return model.value != null && String(model.value).trim() !== "";
}

function countAdvancedFilterRules(model: AdvancedFilterModel | null): number {
  if (!model) {
    return 0;
  }

  if (model.kind === "rule") {
    return isAdvancedFilterActive(model) ? 1 : 0;
  }

  return model.conditions.reduce(
    (total, condition) => total + countAdvancedFilterRules(condition),
    0,
  );
}

function matchesAdvancedFilterModel<T>(
  row: T,
  columns: Column<T>[],
  model: AdvancedFilterModel | null,
): boolean {
  if (!model || !isAdvancedFilterActive(model)) {
    return true;
  }

  if (model.kind === "group") {
    const activeConditions = model.conditions.filter(isAdvancedFilterActive);

    if (!activeConditions.length) {
      return true;
    }

    return model.joinOperator === "or"
      ? activeConditions.some((condition) =>
          matchesAdvancedFilterModel(row, columns, condition),
        )
      : activeConditions.every((condition) =>
          matchesAdvancedFilterModel(row, columns, condition),
        );
  }

  const column = columns.find((entry) => entry.id === model.columnId);

  if (!column) {
    return true;
  }

  return matchesColumnFilter(row, column, {
    type: getColumnFilterType(column),
    operator: model.operator,
    value: model.value,
    valueTo: model.valueTo,
    values: model.values,
  });
}

function updateAdvancedFilterAtPath(
  model: AdvancedFilterModel,
  path: number[],
  updater: (node: AdvancedFilterModel) => AdvancedFilterModel,
): AdvancedFilterModel {
  if (!path.length) {
    return updater(model);
  }

  if (model.kind !== "group") {
    return model;
  }

  const [index, ...rest] = path;

  return {
    ...model,
    conditions: model.conditions.map((condition, conditionIndex) =>
      conditionIndex === index
        ? updateAdvancedFilterAtPath(condition, rest, updater)
        : condition,
    ),
  };
}

function removeAdvancedFilterAtPath(
  model: AdvancedFilterModel,
  path: number[],
): AdvancedFilterModel | null {
  if (!path.length) {
    return null;
  }

  if (model.kind !== "group") {
    return model;
  }

  const [index, ...rest] = path;

  if (!rest.length) {
    const conditions = model.conditions.filter(
      (_condition, conditionIndex) => conditionIndex !== index,
    );

    return conditions.length ? { ...model, conditions } : null;
  }

  const nextConditions = model.conditions
    .map((condition, conditionIndex) =>
      conditionIndex === index
        ? removeAdvancedFilterAtPath(condition, rest)
        : condition,
    )
    .filter((condition): condition is AdvancedFilterModel => Boolean(condition));

  return nextConditions.length ? { ...model, conditions: nextConditions } : null;
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

function makePivotColumnId(...parts: string[]): string {
  return `__pivot_${parts
    .join("_")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

function aggregatePivotValues(
  values: unknown[],
  aggregation: PivotAggregation,
): number {
  if (aggregation === "count") {
    return values.length;
  }

  const numbers = values
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  if (!numbers.length) {
    return 0;
  }

  if (aggregation === "avg") {
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  if (aggregation === "min") {
    return Math.min(...numbers);
  }

  if (aggregation === "max") {
    return Math.max(...numbers);
  }

  return numbers.reduce((sum, value) => sum + value, 0);
}

function buildPivotResult<T>(
  rows: T[],
  columns: Column<T>[],
  groupBy: (keyof T & string) | undefined,
  pivotBy: (keyof T & string) | undefined,
  pivotValueColumns: Array<keyof T & string> | undefined,
  pivotAggregation: PivotAggregation,
): PivotResult<T> {
  if (!pivotBy) {
    return { active: false, columns, rows };
  }

  const groupColumn = groupBy
    ? columns.find(
        (column) => column.field === groupBy || column.id === groupBy,
      )
    : undefined;
  const configuredValueColumns = (pivotValueColumns ?? [])
    .map((columnId) =>
      columns.find(
        (column) => column.field === columnId || column.id === columnId,
      ),
    )
    .filter((column): column is Column<T> => Boolean(column));
  const inferredValueColumns = columns.filter((column) => {
    if (column.hidden || column.field === groupBy || column.field === pivotBy) {
      return false;
    }

    return rows.some((row) => typeof getColumnValue(row, column) === "number");
  });
  const valueColumns =
    configuredValueColumns.length > 0
      ? configuredValueColumns
      : inferredValueColumns;
  const pivotLabels = Array.from(
    new Set(rows.map((row) => String(row[pivotBy] ?? "Blank"))),
  ).sort((left, right) =>
    left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
  const groupBuckets = new Map<string, { label: string; items: T[] }>();

  rows.forEach((row) => {
    const groupLabel = groupBy ? String(row[groupBy] ?? "Ungrouped") : "Total";
    const bucket = groupBuckets.get(groupLabel) ?? {
      label: groupLabel,
      items: [],
    };

    bucket.items.push(row);
    groupBuckets.set(groupLabel, bucket);
  });

  const labelField = "__pivotGroupLabel";
  const labelColumn: Column<T> = groupColumn
    ? ({
        ...groupColumn,
        id: makePivotColumnId("group", groupColumn.id),
        field: labelField as Extract<keyof T, string>,
        headerName: groupColumn.headerName,
        editable: false,
        filterable: false,
        valueGetter: (row) =>
          String((row as Record<string, unknown>)[labelField] ?? ""),
      } as Column<T>)
    : ({
        id: makePivotColumnId("group"),
        field: labelField as Extract<keyof T, string>,
        headerName: "Pivot",
        width: 180,
        sortable: true,
        editable: false,
        filterable: false,
        valueGetter: (row) =>
          String((row as Record<string, unknown>)[labelField] ?? ""),
      } as Column<T>);
  const hasValueColumns = valueColumns.length > 0;
  const measureColumns = hasValueColumns
    ? valueColumns
    : [
        {
          id: "__count",
          field: "__count" as Extract<keyof T, string>,
          headerName: "Count",
        } as Column<T>,
      ];
  const dynamicColumns = pivotLabels.flatMap((pivotLabel) =>
    measureColumns.map((valueColumn) => {
      const columnId = makePivotColumnId(
        String(pivotBy),
        pivotLabel,
        valueColumn.id,
      );
      const headerName =
        measureColumns.length === 1
          ? pivotLabel
          : `${pivotLabel} ${valueColumn.headerName}`;

      return {
        id: columnId,
        field: columnId as Extract<keyof T, string>,
        headerName,
        width: Math.max(120, Math.min(220, headerName.length * 10 + 36)),
        sortable: true,
        filterable: false,
        editable: false,
        valueGetter: (row: T) => (row as Record<string, unknown>)[columnId],
        valueFormatter: (value: unknown) =>
          typeof value === "number" ? formatNumber(value) : String(value ?? ""),
      } as Column<T>;
    }),
  );
  const pivotRows = Array.from(groupBuckets.values()).map((bucket) => {
    const pivotRow: Record<string, unknown> = {
      [labelField]: bucket.label,
    };

    pivotLabels.forEach((pivotLabel) => {
      const pivotItems = bucket.items.filter(
        (row) => String(row[pivotBy] ?? "Blank") === pivotLabel,
      );

      measureColumns.forEach((valueColumn) => {
        const columnId = makePivotColumnId(
          String(pivotBy),
          pivotLabel,
          valueColumn.id,
        );
        const values = hasValueColumns
          ? pivotItems.map((row) => getColumnValue(row, valueColumn))
          : pivotItems;

        pivotRow[columnId] = aggregatePivotValues(values, pivotAggregation);
      });
    });

    return pivotRow as T;
  });

  return {
    active: true,
    columns: [labelColumn, ...dynamicColumns],
    rows: pivotRows,
  };
}

function buildTreeRows<T>(
  rows: T[],
  getTreeDataPath: ((row: T) => string[]) | undefined,
  collapsedKeys: Set<string>,
): Array<DataRow<T>> {
  if (!getTreeDataPath) {
    return rows.map((row, rowIndex) => ({
      kind: "data",
      row,
      rowIndex,
      groupKey: "",
    }));
  }

  const keyedRows = rows
    .map((row, sourceIndex) => {
      const path = getTreeDataPath(row).filter(Boolean);

      return {
        row,
        sourceIndex,
        path,
        key: path.join("/"),
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
  const parentKeys = new Set<string>();

  keyedRows.forEach((entry) => {
    entry.path.slice(0, -1).forEach((_, index) => {
      parentKeys.add(entry.path.slice(0, index + 1).join("/"));
    });
  });

  const visibleRows: Array<DataRow<T>> = [];

  keyedRows.forEach((entry) => {
    const isHidden = entry.path
      .slice(0, -1)
      .some((_, index) =>
        collapsedKeys.has(entry.path.slice(0, index + 1).join("/")),
      );

    if (isHidden) {
      return;
    }

    visibleRows.push({
      kind: "data",
      row: entry.row,
      rowIndex: visibleRows.length,
      groupKey: "",
      depth: Math.max(0, entry.path.length - 1),
      treeKey: entry.key,
      hasChildren: parentKeys.has(entry.key),
      expanded: !collapsedKeys.has(entry.key),
    });
  });

  return visibleRows;
}

export function GridNexa<T>({
  rows,
  columns,
  className,
  theme = "dark",
  density = "standard",
  unstyled = false,
  classNames = {},
  getRowClassName,
  getCellClassName,
  getHeaderClassName,
  mergedHeaders,
  columnFilters,
  quickFilterText: quickFilterTextProp,
  externalFilter,
  advancedFilter,
  advancedFilterModel: advancedFilterModelProp,
  onAdvancedFilterModelChange,
  rowNumbers = false,
  checkboxSelection = false,
  enableRangeSelection = true,
  enableFillHandle = true,
  enableUndoRedo = true,
  enableRowReorder = false,
  rowReorderPosition = "right",
  toolbar,
  localeText,
  getRowId,
  onGridReady,
  onRowsChange,
  onRowClick,
  onRowDoubleClick,
  onRowSelected,
  onSelectedRowChange,
  onCellValueChange,
  onCellClick,
  onCellDoubleClick,
  onCellEditStart,
  onCellEditStop,
  onRowSelectionChange,
  onSelectionChanged,
  onRowOrderChange,
  onRowDragStart,
  onRowDragEnd,
  onRangeSelectionChange,
  onSortModelChange,
  onSortChanged,
  onFilterModelChange,
  onFilterChanged,
  onQuickFilterChange,
  onPageChange,
  onColumnOrderChange,
  onColumnMoved,
  onColumnResize,
  onColumnResized,
  onColumnVisibilityChange,
  onColumnVisible,
  onColumnPin,
  onColumnPinned,
  onCopy,
  onPaste,
  onFill,
  onExport,
  onSaveAll,
  onServerSideOperation,
  groupBy: groupByProp,
  pivotBy: pivotByProp,
  pivotValueColumns: pivotValueColumnsProp,
  pivotAggregation: pivotAggregationProp = "sum",
  onPivotModelChange,
  getTreeDataPath,
  masterDetailRenderer,
  transaction,
  pageSize,
  ai,
}: GridNexaExtendedProps<T>) {
  useInsertionEffect(() => {
    if (!unstyled) {
      injectGridNexaStyles();
    }
  }, [unstyled]);

  const [gridRows, setGridRows] = useState(rows);
  const [columnWidths, setColumnWidths] = useState(() =>
    columns.map((column) => column.width ?? 150),
  );
  const [sortModel, setSortModel] = useState<SortModel | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(
    () => new Set(),
  );
  const [activeCell, setActiveCellState] = useState<CellPosition | null>(null);
  const [selectionAnchor, setSelectionAnchorState] =
    useState<CellPosition | null>(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [findText, setFindText] = useState("");
  const [findMatchIndex, setFindMatchIndex] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlan, setAiPlan] = useState<GridNexaCommandPlan | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [advancedFilterPanelOpen, setAdvancedFilterPanelOpen] =
    useState(false);
  const [pivotPanelOpen, setPivotPanelOpen] = useState(false);
  const [sideFilterPanelOpen, setSideFilterPanelOpen] = useState(false);
  const [pivotToolSearch, setPivotToolSearch] = useState("");
  const [filterPopoverColumnId, setFilterPopoverColumnId] = useState<
    string | null
  >(null);
  const [columnMenuColumnId, setColumnMenuColumnId] = useState<string | null>(
    null,
  );
  const [filterModel, setFilterModel] = useState<
    Record<string, ColumnFilterModel>
  >(() => columnFilters ?? {});
  const [advancedFilterModel, setAdvancedFilterModelState] =
    useState<AdvancedFilterModel | null>(() => advancedFilterModelProp ?? null);
  const [runtimeGroupBy, setRuntimeGroupBy] = useState<
    (keyof T & string) | undefined
  >(() => groupByProp);
  const [runtimePivotBy, setRuntimePivotBy] = useState<
    (keyof T & string) | undefined
  >(() => pivotByProp);
  const [runtimePivotValueColumns, setRuntimePivotValueColumns] = useState<
    Array<keyof T & string>
  >(() => pivotValueColumnsProp ?? []);
  const [runtimePivotAggregation, setRuntimePivotAggregation] =
    useState<PivotAggregation>(() => pivotAggregationProp);
  const [undoStack, setUndoStack] = useState<T[][]>([]);
  const [redoStack, setRedoStack] = useState<T[][]>([]);
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedTreeKeys, setCollapsedTreeKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedDetailKeys, setExpandedDetailKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dropTargetRowIndex, setDropTargetRowIndex] = useState<number | null>(
    null,
  );
  const [cellContextMenu, setCellContextMenu] =
    useState<CellContextMenuState | null>(null);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<Set<string>>(
    () =>
      new Set(
        columns.filter((column) => column.hidden).map((column) => column.id),
      ),
  );
  const [pinnedColumnIds, setPinnedColumnIds] = useState<
    Record<string, "left" | "right" | null | undefined>
  >(() =>
    Object.fromEntries(
      columns
        .filter((column) => column.pinned)
        .map((column) => [column.id, column.pinned]),
    ),
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((column) => column.id),
  );
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState<string | null>(
    null,
  );
  const [columnChooserOpen, setColumnChooserOpen] = useState(false);
  const [dynamicColumnWidths, setDynamicColumnWidths] = useState<
    Record<string, number>
  >({});
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const advancedFilterPanelRef = useRef<HTMLDivElement | null>(null);
  const pivotPanelRef = useRef<HTMLDivElement | null>(null);
  const chooserRef = useRef<HTMLDivElement | null>(null);
  const resizeSession = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const readyEmittedRef = useRef(false);

  useEffect(() => {
    if (readyEmittedRef.current) {
      return;
    }

    readyEmittedRef.current = true;
    onGridReady?.({ rows: gridRows, columns });
  }, [columns, gridRows, onGridReady]);

  useEffect(() => {
    setGridRows(rows);
    setUndoStack([]);
    setRedoStack([]);
  }, [rows]);

  useEffect(() => {
    if (!transaction) {
      return;
    }

    const getId = (row: T, index: number) => getRowId?.(row, index) ?? index;

    replaceGridRows((currentRows) => {
      const removeIds = new Set(
        (transaction.remove ?? []).map((row, index) => getId(row, index)),
      );
      const updateRows = new Map(
        (transaction.update ?? []).map((row, index) => [
          getId(row, index),
          row,
        ]),
      );
      const nextRows = currentRows
        .filter((row, index) => !removeIds.has(getId(row, index)))
        .map((row, index) => updateRows.get(getId(row, index)) ?? row);

      return [...nextRows, ...(transaction.add ?? [])];
    }, "transaction");
  }, [getRowId, transaction]);

  useEffect(() => {
    if (columnFilters) {
      setFilterModel(columnFilters);
    }
  }, [columnFilters]);

  useEffect(() => {
    if (advancedFilterModelProp !== undefined) {
      setAdvancedFilterModelState(advancedFilterModelProp);
    }
  }, [advancedFilterModelProp]);

  useEffect(() => {
    setRuntimeGroupBy(groupByProp);
  }, [groupByProp]);

  useEffect(() => {
    setRuntimePivotBy(pivotByProp);
  }, [pivotByProp]);

  useEffect(() => {
    setRuntimePivotValueColumns(pivotValueColumnsProp ?? []);
  }, [pivotValueColumnsProp]);

  useEffect(() => {
    setRuntimePivotAggregation(pivotAggregationProp);
  }, [pivotAggregationProp]);

  const groupBy = runtimeGroupBy;
  const pivotBy = runtimePivotBy;
  const pivotValueColumns = runtimePivotValueColumns;
  const pivotAggregation = runtimePivotAggregation;

  useEffect(() => {
    if (
      !filterPanelOpen &&
      !columnChooserOpen &&
      !advancedFilterPanelOpen &&
      !pivotPanelOpen &&
      !sideFilterPanelOpen
    ) {
      return;
    }

    const closeFloatingPanels = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (filterPanelOpen && !filterPanelRef.current?.contains(target)) {
        setFilterPanelOpen(false);
      }

      if (
        advancedFilterPanelOpen &&
        !advancedFilterPanelRef.current?.contains(target)
      ) {
        setAdvancedFilterPanelOpen(false);
      }

      if (columnChooserOpen && !chooserRef.current?.contains(target)) {
        setColumnChooserOpen(false);
      }

      if (pivotPanelOpen && !pivotPanelRef.current?.contains(target)) {
        setPivotPanelOpen(false);
      }

      if (sideFilterPanelOpen && !pivotPanelRef.current?.contains(target)) {
        setSideFilterPanelOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setFilterPanelOpen(false);
      setAdvancedFilterPanelOpen(false);
      setColumnChooserOpen(false);
      setPivotPanelOpen(false);
      setSideFilterPanelOpen(false);
    };

    document.addEventListener("pointerdown", closeFloatingPanels, true);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeFloatingPanels, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [
    advancedFilterPanelOpen,
    columnChooserOpen,
    filterPanelOpen,
    pivotPanelOpen,
    sideFilterPanelOpen,
  ]);

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
    setSelectedRowIds(new Set());
    setActiveCellState(null);
    setSelectionAnchorState(null);
    setCollapsedGroups(new Set());
    setCollapsedTreeKeys(new Set());
    setExpandedDetailKeys(new Set());
    setPageIndex(0);
    setDraggedRowIndex(null);
    setDropTargetRowIndex(null);
    setHiddenColumnIds(
      new Set(
        columns.filter((column) => column.hidden).map((column) => column.id),
      ),
    );
    setPinnedColumnIds(
      Object.fromEntries(
        columns
          .filter((column) => column.pinned)
          .map((column) => [column.id, column.pinned]),
      ),
    );
    setColumnOrder(columns.map((column) => column.id));
    setDraggedColumnId(null);
    setDropTargetColumnId(null);
    setColumnChooserOpen(false);
    setFilterPopoverColumnId(null);
    setColumnMenuColumnId(null);
    setDynamicColumnWidths({});
  }, [columnSignature]);

  const effectiveColumns = useMemo<Column<T>[]>(
    () =>
      columns.map((column) => ({
        ...column,
        pinned: Object.prototype.hasOwnProperty.call(pinnedColumnIds, column.id)
          ? (pinnedColumnIds[column.id] ?? undefined)
          : column.pinned,
      })),
    [columns, pinnedColumnIds],
  );

  const orderedByUserColumns = useMemo<Column<T>[]>(() => {
    const byId = new Map(effectiveColumns.map((column) => [column.id, column]));
    const ordered = columnOrder
      .flatMap((columnId) => {
        const column = byId.get(columnId);

        return column ? [column] : [];
      });
    const missing = effectiveColumns.filter(
      (column) => !columnOrder.includes(column.id),
    );

    return [...ordered, ...missing];
  }, [columnOrder, effectiveColumns]);

  const visibleColumns = useMemo(
    () =>
      orderedByUserColumns.filter((column) => !hiddenColumnIds.has(column.id)),
    [hiddenColumnIds, orderedByUserColumns],
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

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeSession.current) {
        return;
      }

      const { columnId, startX, startWidth } = resizeSession.current;
      const nextWidth = Math.max(60, startWidth + (event.clientX - startX));
      const sourceColumnIndex = columns.findIndex(
        (column) => column.id === columnId,
      );

      onColumnResize?.({ columnId, width: nextWidth });
      onColumnResized?.({ columnId, width: nextWidth });

      if (sourceColumnIndex >= 0) {
        setColumnWidths((currentWidths) =>
          currentWidths.map((width, index) =>
            index === sourceColumnIndex ? nextWidth : width,
          ),
        );
        return;
      }

      setDynamicColumnWidths((currentWidths) => ({
        ...currentWidths,
        [columnId]: nextWidth,
      }));
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
  }, [columns, onColumnResize, onColumnResized]);

  const replaceGridRows = (
    updater: (currentRows: T[]) => T[],
    reason: GridNexaRowsChangeReason,
  ) => {
    setGridRows((currentRows) => {
      const nextRows = updater(currentRows);

      if (nextRows === currentRows) {
        return currentRows;
      }

      if (enableUndoRedo) {
        setUndoStack((currentStack) => [
          ...currentStack.slice(-19),
          currentRows,
        ]);
        setRedoStack([]);
      }

      onRowsChange?.({ rows: nextRows, previousRows: currentRows, reason });

      return nextRows;
    });
  };

  const undo = () => {
    setUndoStack((currentStack) => {
      const previousRows = currentStack.at(-1);

      if (!previousRows) {
        return currentStack;
      }

      setRedoStack((currentRedo) => [gridRows, ...currentRedo.slice(0, 19)]);
      setGridRows(previousRows);
      onRowsChange?.({
        rows: previousRows,
        previousRows: gridRows,
        reason: "undo",
      });

      return currentStack.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((currentStack) => {
      const nextRows = currentStack[0];

      if (!nextRows) {
        return currentStack;
      }

      setUndoStack((currentUndo) => [...currentUndo.slice(-19), gridRows]);
      setGridRows(nextRows);
      onRowsChange?.({ rows: nextRows, previousRows: gridRows, reason: "redo" });

      return currentStack.slice(1);
    });
  };

  const resolvedRows = useMemo(
    () => sortRows(gridRows, columns, sortModel),
    [gridRows, columns, sortModel],
  );

  const filteredRows = useMemo(() => {
    const query = (quickFilterTextProp ?? quickFilterText).trim().toLowerCase();
    const activeFilterEntries = Object.entries(filterModel).filter(
      ([, filter]) => isFilterActive(filter),
    );

    return resolvedRows.filter((row) => {
      if (externalFilter && !externalFilter(row)) {
        return false;
      }

      if (advancedFilter && !advancedFilter(row)) {
        return false;
      }

      if (!matchesAdvancedFilterModel(row, columns, advancedFilterModel)) {
        return false;
      }

      const columnFiltersMatch = activeFilterEntries.every(
        ([columnId, filter]) => {
          const column = columns.find((entry) => entry.id === columnId);

          return column ? matchesColumnFilter(row, column, filter) : true;
        },
      );

      if (!columnFiltersMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      return orderedColumns.some((column) =>
        String(getColumnValue(row, column) ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [
    resolvedRows,
    quickFilterTextProp,
    quickFilterText,
    filterModel,
    externalFilter,
    advancedFilter,
    advancedFilterModel,
    columns,
    orderedColumns,
  ]);

  const pivotResult = useMemo(
    () =>
      buildPivotResult(
        filteredRows,
        orderedColumns,
        groupBy,
        pivotBy,
        pivotValueColumns,
        pivotAggregation,
      ),
    [
      filteredRows,
      groupBy,
      orderedColumns,
      pivotAggregation,
      pivotBy,
      pivotValueColumns,
    ],
  );
  const sortedPivotRows = useMemo(
    () =>
      pivotResult.active
        ? sortRows(pivotResult.rows, pivotResult.columns, sortModel)
        : [],
    [pivotResult.active, pivotResult.columns, pivotResult.rows, sortModel],
  );
  const rowCountForPaging = pivotResult.active
    ? sortedPivotRows.length
    : filteredRows.length;
  const pageCount =
    pageSize && pageSize > 0
      ? Math.max(1, Math.ceil(rowCountForPaging / pageSize))
      : 1;
  const pagedRows = useMemo(() => {
    if (!pageSize || pageSize <= 0) {
      return filteredRows;
    }

    const start = pageIndex * pageSize;

    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageIndex, pageSize]);
  const pagedPivotRows = useMemo(() => {
    if (!pivotResult.active) {
      return [];
    }

    if (!pageSize || pageSize <= 0) {
      return sortedPivotRows;
    }

    const start = pageIndex * pageSize;

    return sortedPivotRows.slice(start, start + pageSize);
  }, [pageIndex, pageSize, pivotResult.active, sortedPivotRows]);

  const groupBuckets = useMemo(
    () => buildGroupBuckets(pagedRows, orderedColumns, groupBy),
    [pagedRows, orderedColumns, groupBy],
  );

  const treeDataRows = useMemo(
    () => buildTreeRows(pagedRows, getTreeDataPath, collapsedTreeKeys),
    [collapsedTreeKeys, getTreeDataPath, pagedRows],
  );

  const visibleDataRows = useMemo(() => {
    if (!groupBy) {
      return treeDataRows.map((entry) => entry.row);
    }

    const dataRows: T[] = [];

    groupBuckets.forEach((bucket) => {
      if (collapsedGroups.has(bucket.key)) {
        return;
      }

      dataRows.push(...bucket.items);
    });

    return dataRows;
  }, [treeDataRows, groupBuckets, groupBy, collapsedGroups]);

  const tableColumns = pivotResult.active
    ? pivotResult.columns
    : orderedColumns;
  const tableRows = pivotResult.active ? pagedPivotRows : visibleDataRows;
  const getRowSelectionId = (row: T, rowIndex: number) =>
    pivotResult.active || !getRowId ? rowIndex : getRowId(row, rowIndex);
  const visibleSelectedRowIds = useMemo(
    () => tableRows.map(getRowSelectionId),
    [getRowId, pivotResult.active, tableRows],
  );
  const selectedTableRows = useMemo(
    () =>
      tableRows.filter((row, rowIndex) =>
        selectedRowIds.has(getRowSelectionId(row, rowIndex)),
      ),
    [getRowId, pivotResult.active, selectedRowIds, tableRows],
  );
  const allVisibleRowsSelected =
    tableRows.length > 0 &&
    visibleSelectedRowIds.every((rowId) => selectedRowIds.has(rowId));
  const someVisibleRowsSelected =
    visibleSelectedRowIds.some((rowId) => selectedRowIds.has(rowId));
  const getSelectedRowsForIds = (ids: Set<string | number>) =>
    tableRows.filter((row, rowIndex) =>
      ids.has(getRowSelectionId(row, rowIndex)),
    );
  const toggleRowSelection = (row: T, rowIndex: number) => {
    const rowId = getRowSelectionId(row, rowIndex);

    setSelectedRowIds((current) => {
      const next = new Set(current);
      const selected = !next.has(rowId);

      if (selected) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }

      onRowSelected?.({
        row,
        rowIndex,
        selected,
        selectedRows: getSelectedRowsForIds(next),
      });

      return next;
    });
    setSelectedRowIndex(rowIndex);
  };
  const toggleAllRowsSelection = () => {
    setSelectedRowIds((current) => {
      const next = new Set(current);

      if (allVisibleRowsSelected) {
        visibleSelectedRowIds.forEach((rowId) => next.delete(rowId));
      } else {
        visibleSelectedRowIds.forEach((rowId) => next.add(rowId));
      }

      return next;
    });
    setSelectedRowIndex(tableRows.length ? 0 : null);
  };
  const tableWidths = tableColumns.map((column, index) => {
    const orderedIndex = orderedColumns.findIndex(
      (entry) => entry.id === column.id,
    );
    const originalIndex = columns.findIndex((entry) => entry.id === column.id);

    return (
      dynamicColumnWidths[column.id] ??
      (orderedIndex >= 0 ? orderedWidths[orderedIndex] : undefined) ??
      (originalIndex >= 0 ? columnWidths[originalIndex] : undefined) ??
      column.width ??
      (index === 0 ? 180 : 140)
    );
  });
  const selectionColumnWidth = checkboxSelection ? 44 : 0;
  const rowNumberColumnWidth = rowNumbers ? 52 : 0;
  const leadingPinnedOffset = selectionColumnWidth + rowNumberColumnWidth;
  const leadingColumnBaseStyle: CSSProperties = {
    position: "sticky",
    zIndex: 4,
    background: "var(--gnx-pinned-bg, var(--gnx-panel-strong, #fff))",
    boxShadow: "inset -1px 0 0 var(--gnx-border, rgba(148, 163, 184, 0.2))",
  };
  const selectionColumnStyle = checkboxSelection
    ? {
        ...leadingColumnBaseStyle,
        left: 0,
      }
    : undefined;
  const rowNumberColumnStyle = rowNumbers
    ? {
        ...leadingColumnBaseStyle,
        left: selectionColumnWidth,
      }
    : undefined;
  const tableColumnStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    let leftOffset = leadingPinnedOffset;

    tableColumns.forEach((column, index) => {
      const width = tableWidths[index] ?? 150;

      if (column.pinned === "left") {
        styles[column.id] = {
          position: "sticky",
          left: leftOffset,
          zIndex: 3,
          background: "var(--gnx-pinned-bg, var(--gnx-bg, #fff))",
          boxShadow:
            "inset -1px 0 0 var(--gnx-border, rgba(148, 163, 184, 0.2))",
        };

        leftOffset += width;
      }
    });

    let rightOffset = 0;

    for (let index = tableColumns.length - 1; index >= 0; index -= 1) {
      const column = tableColumns[index];
      const width = tableWidths[index] ?? 150;

      if (column.pinned === "right") {
        styles[column.id] = {
          ...styles[column.id],
          position: "sticky",
          right: rightOffset,
          zIndex: 3,
          background: "var(--gnx-pinned-bg, var(--gnx-bg, #fff))",
          boxShadow:
            "inset 1px 0 0 var(--gnx-border, rgba(148, 163, 184, 0.2))",
        };

        rightOffset += width;
      }
    }

    return styles;
  }, [leadingPinnedOffset, tableColumns, tableWidths]);

  useEffect(() => {
    onServerSideOperation?.({
      sortModel: sortModel ? [sortModel] : [],
      filterModel,
      advancedFilterModel,
      selectedRowIds: Array.from(selectedRowIds),
      pageIndex,
      pageSize,
      groupBy,
      pivotBy,
      pivotValueColumns,
      pivotAggregation,
      treeData: Boolean(getTreeDataPath),
      masterDetail: Boolean(masterDetailRenderer),
      transaction,
    });
  }, [
    advancedFilterModel,
    filterModel,
    getRowId,
    getTreeDataPath,
    groupBy,
    masterDetailRenderer,
    onServerSideOperation,
    pageIndex,
    pageSize,
    pivotAggregation,
    pivotBy,
    pivotValueColumns,
    selectedRowIds,
    sortModel,
    transaction,
  ]);

  const findMatches = useMemo(() => {
    const query = findText.trim().toLowerCase();

    if (!query) {
      return [];
    }

    const matches: CellPosition[] = [];

    tableRows.forEach((row, rowIndex) => {
      tableColumns.forEach((column, columnIndex) => {
        const value = getColumnValue(row, column);

        if (
          String(value ?? "")
            .toLowerCase()
            .includes(query)
        ) {
          matches.push({ rowIndex, columnIndex });
        }
      });
    });

    return matches;
  }, [findText, tableColumns, tableRows]);

  const findMatch = findMatches.length
    ? findMatches[findMatchIndex % findMatches.length]
    : null;

  useEffect(() => {
    setFindMatchIndex(0);
  }, [findText, tableRows.length]);

  useEffect(() => {
    if (!findMatch) {
      return;
    }

    setActiveCellState(findMatch);
    setSelectedRowIndex(findMatch.rowIndex);
    setSelectionAnchorState(findMatch);
  }, [findMatch]);

  const displayRows = useMemo<DisplayRow<T>[]>(() => {
    const appendDetailRow = (
      rowsToAppend: DisplayRow<T>[],
      row: T,
      rowIndex: number,
    ) => {
      if (!masterDetailRenderer) {
        return;
      }

      const rowKey = String(getRowId ? getRowId(row, rowIndex) : rowIndex);

      if (expandedDetailKeys.has(rowKey)) {
        rowsToAppend.push({
          kind: "detail",
          key: rowKey,
          row,
          content: masterDetailRenderer(row),
        });
      }
    };

    if (pivotResult.active) {
      return tableRows.map((row, rowIndex) => ({
        kind: "data",
        row,
        rowIndex,
        groupKey: "__pivot",
      }));
    }

    if (!groupBy) {
      const sourceRows = getTreeDataPath
        ? treeDataRows
        : visibleDataRows.map((row, rowIndex) => ({
            kind: "data" as const,
            row,
            rowIndex,
            groupKey: "",
            hasDetail: Boolean(masterDetailRenderer),
          }));
      const nextRows: DisplayRow<T>[] = [];

      sourceRows.forEach((entry) => {
        nextRows.push({ ...entry, hasDetail: Boolean(masterDetailRenderer) });
        appendDetailRow(nextRows, entry.row, entry.rowIndex);
      });

      return nextRows;
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
          hasDetail: Boolean(masterDetailRenderer),
        });

        appendDetailRow(nextRows, row, dataRowIndex);
        dataRowIndex += 1;
      });
    });

    return nextRows;
  }, [
    collapsedGroups,
    expandedDetailKeys,
    getRowId,
    getTreeDataPath,
    groupBy,
    groupBuckets,
    masterDetailRenderer,
    orderedColumns,
    pivotResult.active,
    tableRows,
    treeDataRows,
    visibleDataRows,
  ]);

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

  const toggleTreeNode = (treeKey: string) => {
    setCollapsedTreeKeys((current) => {
      const next = new Set(current);

      if (next.has(treeKey)) {
        next.delete(treeKey);
      } else {
        next.add(treeKey);
      }

      return next;
    });
  };

  const toggleDetailRow = (rowIndex: number) => {
    const row = visibleDataRows[rowIndex];

    if (!row) {
      return;
    }

    const rowKey = String(getRowId ? getRowId(row, rowIndex) : rowIndex);

    setExpandedDetailKeys((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  };

  const resetRowDragState = () => {
    const row =
      draggedRowIndex == null ? null : (visibleDataRows[draggedRowIndex] ?? null);

    onRowDragEnd?.({
      row,
      rowIndex: row == null ? null : draggedRowIndex,
    });
    setDraggedRowIndex(null);
    setDropTargetRowIndex(null);
  };

  const findRowIndex = (row: T) => gridRows.findIndex((entry) => entry === row);

  const reorderVisibleRows = (
    sourceRowIndex: number,
    targetRowIndex: number,
  ) => {
    if (pivotResult.active) {
      return;
    }

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

    replaceGridRows((currentRows) => {
      const nextRows = [...currentRows];
      const [movedRow] = nextRows.splice(sourceOriginalIndex, 1);

      nextRows.splice(targetOriginalIndex, 0, movedRow);

      onRowOrderChange?.({
        rows: nextRows,
        movedRow,
        sourceIndex: sourceOriginalIndex,
        targetIndex: targetOriginalIndex,
      });

      return nextRows;
    }, "rowReorder");
  };

  const moveVisibleRow = (rowIndex: number, direction: -1 | 1) => {
    reorderVisibleRows(rowIndex, rowIndex + direction);
  };

  useEffect(() => {
    if (selectedRowIndex == null) {
      return;
    }

    if (tableRows.length === 0) {
      setSelectedRowIndex(null);
      return;
    }

    if (selectedRowIndex >= tableRows.length) {
      setSelectedRowIndex(tableRows.length - 1);
    }
  }, [selectedRowIndex, tableRows.length]);

  useEffect(() => {
    onRowSelectionChange?.(selectedTableRows);
    onSelectionChanged?.({
      selectedRows: selectedTableRows,
      selectedRowIds: Array.from(selectedRowIds),
    });
  }, [onRowSelectionChange, onSelectionChanged, selectedRowIds, selectedTableRows]);

  useEffect(() => {
    const row =
      selectedRowIndex == null ? null : (tableRows[selectedRowIndex] ?? null);

    onSelectedRowChange?.({
      row,
      rowIndex: row == null ? null : selectedRowIndex,
      selectedRows: selectedTableRows,
    });
  }, [onSelectedRowChange, selectedRowIndex, selectedTableRows, tableRows]);

  useEffect(() => {
    const model = sortModel ? [sortModel] : [];

    onSortModelChange?.(model);
    onSortChanged?.(model);
  }, [onSortChanged, onSortModelChange, sortModel]);

  useEffect(() => {
    onFilterModelChange?.(filterModel);
    onFilterChanged?.(filterModel);
  }, [filterModel, onFilterChanged, onFilterModelChange]);

  useEffect(() => {
    onQuickFilterChange?.(quickFilterTextProp ?? quickFilterText);
  }, [onQuickFilterChange, quickFilterText, quickFilterTextProp]);

  useEffect(() => {
    onPageChange?.({ pageIndex, pageSize });
  }, [onPageChange, pageIndex, pageSize]);

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

    if (activeCell.rowIndex >= tableRows.length || tableColumns.length === 0) {
      setActiveCellState(null);
      setSelectionAnchorState(null);
      return;
    }

    if (activeCell.columnIndex >= tableColumns.length) {
      setActiveCellState({
        rowIndex: activeCell.rowIndex,
        columnIndex: tableColumns.length - 1,
      });
    }
  }, [activeCell, tableColumns.length, tableRows.length]);

  const renderer = useMemo(
    () => new GridRenderer(tableColumns, tableWidths),
    [tableColumns, tableWidths],
  );
  const dataColumnTemplate = useMemo(() => {
    if (!tableColumns.length) {
      return renderer.getTemplate();
    }

    return tableColumns
      .map((column, index) => {
        const width = tableWidths[index] ?? column.width ?? 150;

        return index === tableColumns.length - 1
          ? `minmax(${width}px, 1fr)`
          : `${width}px`;
      })
      .join(" ");
  }, [renderer, tableColumns, tableWidths]);
  const leadingTemplate = [
    checkboxSelection ? "44px" : null,
    rowNumbers ? "52px" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const tableMinWidth =
    leadingPinnedOffset +
    tableWidths.reduce((total, width) => total + (width ?? 150), 0);
  const template = leadingTemplate
    ? `${leadingTemplate} ${dataColumnTemplate}`
    : dataColumnTemplate;

  const getCellRange = () => {
    if (!enableRangeSelection || !activeCell || !selectionAnchor) {
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

  const cellRange = useMemo(
    () => getCellRange(),
    [activeCell, enableRangeSelection, selectionAnchor],
  );

  useEffect(() => {
    onRangeSelectionChange?.(cellRange);
  }, [cellRange, onRangeSelectionChange]);

  const parsePastedValue = (rawValue: string, currentValue: unknown) => {
    if (typeof currentValue === "number") {
      const parsed = Number(rawValue);

      return Number.isNaN(parsed) ? currentValue : parsed;
    }

    return rawValue;
  };

  const copySelection = async () => {
    const cellToText = (rowIndex: number, columnIndex: number) => {
      const row = tableRows[rowIndex];
      const column = tableColumns[columnIndex];

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
    onCopy?.({ text, range: cellRange });
  };

  const exportVisibleRowsToCsv = () => {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const headerLine = tableColumns
      .map((column) => escapeCsv(column.headerName))
      .join(",");
    const dataLines = tableRows.map((row) =>
      tableColumns
        .map((column) => escapeCsv(getColumnValue(row, column)))
        .join(","),
    );

    const csv = [headerLine, ...dataLines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "gridnexa-export.csv";
    link.click();

    URL.revokeObjectURL(downloadUrl);
    onExport?.({ format: "csv", rows: tableRows });
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

    replaceGridRows((currentRows) => {
      const nextRows = [...currentRows];
      const updates = new Map<number, Record<string, unknown>>();

      for (const [viewRowIndex, viewColumnIndex, rawValue] of targetRows) {
        const row = tableRows[viewRowIndex];
        const column = tableColumns[viewColumnIndex];

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
    }, "paste");
    onPaste?.({ text });
  };

  const openCellContextMenu = (
    rowIndex: number,
    columnIndex: number,
    x: number,
    y: number,
  ) => {
    setCellContextMenu({ rowIndex, columnIndex, x, y });
  };

  const closeCellContextMenu = () => {
    setCellContextMenu(null);
  };

  const startContextCellEdit = () => {
    if (!cellContextMenu) {
      return;
    }

    const row = tableRows[cellContextMenu.rowIndex];
    const column = tableColumns[cellContextMenu.columnIndex];

    if (row && column) {
      startCellEdit(
        cellContextMenu.rowIndex,
        column.id,
        String(getRawColumnValue(row, column) ?? ""),
      );
    }

    closeCellContextMenu();
  };

  const clearContextCell = () => {
    if (!cellContextMenu) {
      return;
    }

    const row = tableRows[cellContextMenu.rowIndex];
    const column = tableColumns[cellContextMenu.columnIndex];

    if (!row || !column || column.editable === false) {
      closeCellContextMenu();
      return;
    }

    const originalIndex = findRowIndex(row);

    if (originalIndex >= 0) {
      replaceGridRows((currentRows) =>
        currentRows.map((entry, index) =>
          index === originalIndex ? { ...entry, [column.field]: "" } : entry,
        ),
        "clear",
      );
    }

    closeCellContextMenu();
  };

  const pasteFromClipboard = async () => {
    const text = await navigator.clipboard.readText();

    if (text) {
      pasteSelection(text);
    }

    closeCellContextMenu();
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

    const row = tableRows[editingCell.rowIndex];

    if (!row) {
      setEditingCell(null);
      return;
    }

    const originalIndex = gridRows.findIndex((entry) => entry === row);

    if (originalIndex < 0) {
      setEditingCell(null);
      return;
    }

    const editor =
      typeof column.editor === "string"
        ? { type: column.editor }
        : (column.editor ?? {});
    const editorOptions = editor.values ?? [];
    const editorValueExists = (value: string) =>
      editorOptions.some((option) =>
        typeof option === "object"
          ? String(option.value) === value
          : String(option) === value,
      );

    if (
      editor.type === "advancedSelect" &&
      editor.allowCustomValue === false &&
      !editorValueExists(editingCell.draftValue)
    ) {
      return;
    }

    const parsedValue = editor.parseValue
      ? editor.parseValue(editingCell.draftValue, row)
      : editor.type === "checkbox"
        ? editingCell.draftValue === "true"
        : typeof row[column.field] === "number" || editor.type === "number"
          ? Number(editingCell.draftValue)
          : editingCell.draftValue;

    replaceGridRows((currentRows) =>
      currentRows.map((entry, index) => {
        if (index !== originalIndex) {
          return entry;
        }

        return {
          ...entry,
          [column.field]: parsedValue,
        };
      }),
      "edit",
    );

    onCellValueChange?.({
      row,
      rowIndex: editingCell.rowIndex,
      column,
      oldValue: row[column.field],
      newValue: parsedValue,
    });
    onCellEditStop?.({
      row,
      rowIndex: editingCell.rowIndex,
      column,
      oldValue: row[column.field],
      newValue: parsedValue,
    });

    setEditingCell(null);
  };

  const startCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const column = columns.find((entry) => entry.id === columnId);
    const row = tableRows[rowIndex];

    if (!row || !column || column.editable === false) {
      return;
    }

    setEditingCell({
      rowIndex,
      columnId,
      draftValue: value,
    });
    onCellEditStart?.({
      row,
      rowIndex,
      column,
      value,
    });
  };

  const handleSort = (columnId: string) => {
    const column = tableColumns.find((entry) => entry.id === columnId);

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
    const column = tableColumns.find((entry) => entry.id === columnId);

    if (!column) {
      return;
    }

    const headerWidth = column.headerName.length * 10 + 40;
    const contentWidth = tableRows.reduce((maxWidth, row) => {
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

    onColumnResize?.({ columnId, width: nextWidth });
    onColumnResized?.({ columnId, width: nextWidth });

    if (originalIndex < 0) {
      setDynamicColumnWidths((currentWidths) => ({
        ...currentWidths,
        [columnId]: nextWidth,
      }));
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

  const handleRowSelect = (rowIndex: number) => {
    const row = tableRows[rowIndex];

    setSelectedRowIndex(rowIndex);

    if (row) {
      onRowClick?.({ row, rowIndex });
    }
  };

  const emitRowDoubleClick = (rowIndex: number) => {
    const row = tableRows[rowIndex];

    if (row) {
      onRowDoubleClick?.({ row, rowIndex });
    }
  };

  const emitCellClick = (rowIndex: number, columnIndex: number) => {
    const row = tableRows[rowIndex];
    const column = tableColumns[columnIndex];

    if (!row || !column) {
      return;
    }

    onCellClick?.({
      row,
      rowIndex,
      column,
      columnIndex,
      value: getColumnValue(row, column),
    });
  };

  const emitCellDoubleClick = (rowIndex: number, columnIndex: number) => {
    const row = tableRows[rowIndex];
    const column = tableColumns[columnIndex];

    if (!row || !column) {
      return;
    }

    onCellDoubleClick?.({
      row,
      rowIndex,
      column,
      columnIndex,
      value: getColumnValue(row, column),
    });
  };

  const setSelectionAnchor = (rowIndex: number, columnIndex: number) => {
    if (!enableRangeSelection) {
      setActiveCell(rowIndex, columnIndex);
      return;
    }

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
    if (!tableColumns.length || !tableRows.length) {
      return;
    }

    const current = activeCell ?? {
      rowIndex: selectedRowIndex ?? 0,
      columnIndex: 0,
    };

    const nextRowIndex = Math.max(
      0,
      Math.min(tableRows.length - 1, current.rowIndex + rowDelta),
    );
    const nextColumnIndex = Math.max(
      0,
      Math.min(tableColumns.length - 1, current.columnIndex + columnDelta),
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

  const fillSelection = () => {
    if (!enableFillHandle || !cellRange) {
      return;
    }

    const sourceRow = tableRows[cellRange.startRow];
    const sourceColumn = tableColumns[cellRange.startColumn];

    if (!sourceRow || !sourceColumn || sourceColumn.editable === false) {
      return;
    }

    const sourceValue = getColumnValue(sourceRow, sourceColumn);

    replaceGridRows((currentRows) => {
      const nextRows = [...currentRows];

      for (
        let rowIndex = cellRange.startRow;
        rowIndex <= cellRange.endRow;
        rowIndex += 1
      ) {
        for (
          let columnIndex = cellRange.startColumn;
          columnIndex <= cellRange.endColumn;
          columnIndex += 1
        ) {
          const row = tableRows[rowIndex];
          const column = tableColumns[columnIndex];

          if (!row || !column || column.editable === false) {
            continue;
          }

          const originalIndex = findRowIndex(row);

          if (originalIndex < 0) {
            continue;
          }

          nextRows[originalIndex] = {
            ...nextRows[originalIndex],
            [column.field]: sourceValue,
          };
        }
      }

      return nextRows;
    }, "fill");
    onFill?.({ range: cellRange, value: sourceValue });
  };

  const handleSortDirection = (
    columnId: string,
    direction: SortDirection | null,
  ) => {
    const column = tableColumns.find((entry) => entry.id === columnId);

    if (!column || column.sortable === false) {
      return;
    }

    setSortModel(direction ? { columnId, direction } : null);
    setColumnMenuColumnId(null);
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

  const rowCountLabel = pivotResult.active
    ? `${tableRows.length} pivot rows from ${filteredRows.length} rows`
    : `${tableRows.length} of ${filteredRows.length} rows shown`;
  const t = (key: string, fallback: string) => localeText?.[key] ?? fallback;
  const toolbarOptions = {
    summary: true,
    pagination: true,
    quickFilter: true,
    find: true,
    undoRedo: true,
    fillHandle: true,
    filters: true,
    advancedFilter: true,
    columns: true,
    exportCsv: true,
    exportExcel: true,
    saveAll: Boolean(onSaveAll),
    ai: true,
    ...(typeof toolbar === "object" ? toolbar : {}),
  };
  const toolbarVisible = toolbar !== false;
  const activeColumn = activeCell ? tableColumns[activeCell.columnIndex] : null;
  const activeCellLabel =
    activeCell && activeColumn
      ? `${activeColumn.headerName} R${activeCell.rowIndex + 1}`
      : "No cell";
  const selectedRowsLabel =
    selectedRowIds.size > 0
      ? `${selectedRowIds.size} selected`
      : selectedRowIndex == null
        ? "No row selected"
        : `Row ${selectedRowIndex + 1}`;
  const rangeSize = cellRange
    ? (cellRange.endRow - cellRange.startRow + 1) *
      (cellRange.endColumn - cellRange.startColumn + 1)
    : 0;
  const activeFilterCount =
    Object.values(filterModel).filter(isFilterActive).length;
  const activeAdvancedFilterCount =
    countAdvancedFilterRules(advancedFilterModel);
  const pivotCandidateColumns = columns;
  const searchedPivotColumns = pivotCandidateColumns.filter((column) =>
    column.headerName.toLowerCase().includes(pivotToolSearch.toLowerCase()),
  );
  const pivotValueCandidateColumns = pivotCandidateColumns.filter((column) =>
    gridRows.some((row) => typeof getColumnValue(row, column) === "number"),
  );
  const pivotModeActive = Boolean(pivotBy);
  const contextColumn = cellContextMenu
    ? tableColumns[cellContextMenu.columnIndex]
    : null;
  const saveAllRows = () => {
    onSaveAll?.({
      rows: gridRows,
      selectedRows: selectedTableRows,
      visibleRows: tableRows,
      reason: "toolbar",
    });
  };

  const setColumnFilter = (
    columnId: string,
    filter: ColumnFilterModel | null,
  ) => {
    setFilterModel((current) => {
      const next = { ...current };

      if (!filter) {
        delete next[columnId];
      } else {
        next[columnId] = filter;
      }

      return next;
    });
    setPageIndex(0);
  };

  const openColumnFilters = (columnId: string) => {
    setFilterPanelOpen(true);
    setColumnMenuColumnId(null);

    if (!filterModel[columnId]) {
      const column = columns.find((entry) => entry.id === columnId);

      if (!column || column.filterable === false) {
        return;
      }

      const filterType = getColumnFilterType(column);

      setColumnFilter(columnId, {
        type: filterType,
        operator:
          filterType === "set"
            ? "in"
            : filterType === "number" || filterType === "date"
              ? "equals"
              : "contains",
        value: "",
        values: filterType === "set" ? [] : undefined,
      });
    }
  };

  const clearColumnFilter = (columnId: string) => {
    setColumnFilter(columnId, null);
    setColumnMenuColumnId(null);
  };

  const getColumnFilterValuesForColumn = (column: Column<T>) =>
    Array.from(
      new Set(gridRows.map((row) => String(getColumnValue(row, column) ?? ""))),
    ).filter(Boolean);

  const emitPivotModelChange = (
    nextGroupBy: (keyof T & string) | undefined,
    nextPivotBy: (keyof T & string) | undefined,
    nextValueColumns: Array<keyof T & string>,
    nextAggregation: PivotAggregation,
  ) => {
    onPivotModelChange?.({
      groupBy: nextGroupBy,
      pivotBy: nextPivotBy,
      pivotValueColumns: nextValueColumns,
      pivotAggregation: nextAggregation,
    });
  };

  const updatePivotModel = (updates: {
    groupBy?: (keyof T & string) | "";
    pivotBy?: (keyof T & string) | "";
    pivotValueColumns?: Array<keyof T & string>;
    pivotAggregation?: PivotAggregation;
  }) => {
    const nextGroupBy =
      updates.groupBy === ""
        ? undefined
        : updates.groupBy !== undefined
          ? updates.groupBy
          : runtimeGroupBy;
    const nextPivotBy =
      updates.pivotBy === ""
        ? undefined
        : updates.pivotBy !== undefined
          ? updates.pivotBy
          : runtimePivotBy;
    const nextValueColumns =
      updates.pivotValueColumns ?? runtimePivotValueColumns;
    const nextAggregation = updates.pivotAggregation ?? runtimePivotAggregation;

    setRuntimeGroupBy(nextGroupBy);
    setRuntimePivotBy(nextPivotBy);
    setRuntimePivotValueColumns(nextValueColumns);
    setRuntimePivotAggregation(nextAggregation);
    setPageIndex(0);
    emitPivotModelChange(
      nextGroupBy,
      nextPivotBy,
      nextValueColumns,
      nextAggregation,
    );
  };

  const clearPivotModel = () => {
    updatePivotModel({
      groupBy: "",
      pivotBy: "",
      pivotValueColumns: [],
      pivotAggregation: "sum",
    });
  };

  const setAdvancedFilterModel = (model: AdvancedFilterModel | null) => {
    if (advancedFilterModelProp === undefined) {
      setAdvancedFilterModelState(model);
    }

    onAdvancedFilterModelChange?.(model);
    setPageIndex(0);
  };

  const ensureAdvancedFilterModel = () => {
    if (!advancedFilterModel) {
      setAdvancedFilterModel(createAdvancedFilterGroup(columns));
    }
  };

  const updateAdvancedFilterModelAtPath = (
    path: number[],
    updater: (node: AdvancedFilterModel) => AdvancedFilterModel,
  ) => {
    setAdvancedFilterModel(
      advancedFilterModel
        ? updateAdvancedFilterAtPath(advancedFilterModel, path, updater)
        : createAdvancedFilterGroup(columns),
    );
  };

  const addAdvancedRule = (path: number[]) => {
    updateAdvancedFilterModelAtPath(path, (node) =>
      node.kind === "group"
        ? {
            ...node,
            conditions: [...node.conditions, createAdvancedFilterRule(columns)],
          }
        : node,
    );
  };

  const addAdvancedGroup = (path: number[]) => {
    updateAdvancedFilterModelAtPath(path, (node) =>
      node.kind === "group"
        ? {
            ...node,
            conditions: [...node.conditions, createAdvancedFilterGroup(columns)],
          }
        : node,
    );
  };

  const removeAdvancedNode = (path: number[]) => {
    setAdvancedFilterModel(
      advancedFilterModel
        ? removeAdvancedFilterAtPath(advancedFilterModel, path)
        : null,
    );
  };

  const renderAdvancedFilterNode = (
    node: AdvancedFilterModel,
    path: number[],
  ): ReactElement => {
    if (node.kind === "group") {
      return (
        <div className="sg-advanced-filter-group" key={node.id ?? path.join(".")}>
          <div className="sg-advanced-filter-group-header">
            <select
              className={cx("sg-filter-operator", mergedClassNames.input)}
              value={node.joinOperator}
              onChange={(event) =>
                updateAdvancedFilterModelAtPath(path, (currentNode) =>
                  currentNode.kind === "group"
                    ? {
                        ...currentNode,
                        joinOperator: event.target
                          .value as typeof currentNode.joinOperator,
                      }
                    : currentNode,
                )
              }
            >
              <option value="and">Match all rules</option>
              <option value="or">Match any rule</option>
            </select>
            <div>
              <button
                className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                type="button"
                onClick={() => addAdvancedRule(path)}
              >
                Add rule
              </button>
              <button
                className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                type="button"
                onClick={() => addAdvancedGroup(path)}
              >
                Add group
              </button>
              {path.length ? (
                <button
                  className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                  type="button"
                  onClick={() => removeAdvancedNode(path)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <div className="sg-advanced-filter-conditions">
            {node.conditions.map((condition, index) =>
              renderAdvancedFilterNode(condition, [...path, index]),
            )}
          </div>
        </div>
      );
    }

    const column =
      columns.find((entry) => entry.id === node.columnId) ??
      columns.find((entry) => entry.filterable !== false) ??
      columns[0];
    const filterType = column ? getColumnFilterType(column) : "text";
    const operators = getFilterOperatorOptions(filterType);
    const uniqueValues = column ? getColumnFilterValuesForColumn(column) : [];
    const needsValue = node.operator !== "blank" && node.operator !== "notBlank";

    return (
      <div className="sg-advanced-filter-rule" key={node.id ?? path.join(".")}>
        <select
          className={cx("sg-filter-input", mergedClassNames.input)}
          value={node.columnId}
          onChange={(event) => {
            const nextColumn = columns.find(
              (entry) => entry.id === event.target.value,
            );
            const nextType = nextColumn ? getColumnFilterType(nextColumn) : "text";
            const nextOperator =
              nextType === "set"
                ? "in"
                : nextType === "number" || nextType === "date"
                  ? "equals"
                  : "contains";

            updateAdvancedFilterModelAtPath(path, (currentNode) =>
              currentNode.kind === "rule"
                ? {
                    ...currentNode,
                    columnId: event.target.value,
                    operator: nextOperator,
                    value: "",
                    valueTo: undefined,
                    values: nextType === "set" ? [] : undefined,
                  }
                : currentNode,
            );
          }}
        >
          {columns
            .filter((entry) => entry.filterable !== false)
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.headerName}
              </option>
            ))}
        </select>
        <select
          className={cx("sg-filter-operator", mergedClassNames.input)}
          value={node.operator}
          onChange={(event) =>
            updateAdvancedFilterModelAtPath(path, (currentNode) =>
              currentNode.kind === "rule"
                ? {
                    ...currentNode,
                    operator: event.target
                      .value as ColumnFilterModel["operator"],
                    value: "",
                    valueTo: undefined,
                    values: event.target.value === "in" ? [] : undefined,
                  }
                : currentNode,
            )
          }
        >
          {operators.map((operator) => (
            <option key={operator} value={operator}>
              {operator}
            </option>
          ))}
        </select>
        {needsValue && node.operator === "in" ? (
          <select
            className={cx("sg-filter-input", mergedClassNames.input)}
            multiple
            value={(node.values ?? []).map(String)}
            onChange={(event) => {
              const values = Array.from(
                event.currentTarget.selectedOptions,
              ).map((option) => option.value);

              updateAdvancedFilterModelAtPath(path, (currentNode) =>
                currentNode.kind === "rule"
                  ? { ...currentNode, values }
                  : currentNode,
              );
            }}
          >
            {uniqueValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ) : needsValue ? (
          <>
            <input
              className={cx("sg-filter-input", mergedClassNames.input)}
              type={
                filterType === "number"
                  ? "number"
                  : filterType === "date"
                    ? "date"
                    : "search"
              }
              value={String(node.value ?? "")}
              onChange={(event) =>
                updateAdvancedFilterModelAtPath(path, (currentNode) =>
                  currentNode.kind === "rule"
                    ? { ...currentNode, value: event.target.value }
                    : currentNode,
                )
              }
              placeholder="Value"
            />
            {node.operator === "between" ? (
              <input
                className={cx("sg-filter-input", mergedClassNames.input)}
                type={filterType === "date" ? "date" : "number"}
                value={String(node.valueTo ?? "")}
                onChange={(event) =>
                  updateAdvancedFilterModelAtPath(path, (currentNode) =>
                    currentNode.kind === "rule"
                      ? { ...currentNode, valueTo: event.target.value }
                      : currentNode,
                  )
                }
                placeholder="To"
              />
            ) : null}
          </>
        ) : (
          <span className="sg-advanced-filter-readonly">No value needed</span>
        )}
        <button
          className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
          type="button"
          onClick={() => removeAdvancedNode(path)}
        >
          Remove
        </button>
      </div>
    );
  };

  const pinColumn = (columnId: string, pinned: "left" | "right" | null) => {
    setPinnedColumnIds((current) => ({
      ...current,
      [columnId]: pinned,
    }));
    onColumnPin?.({ columnId, pinned });
    onColumnPinned?.({ columnId, pinned });
    setColumnMenuColumnId(null);
  };

  const getColumnLane = (columnId: string) => {
    const column = effectiveColumns.find((entry) => entry.id === columnId);

    return column?.pinned ?? null;
  };

  const reorderColumn = (sourceColumnId: string, targetColumnId: string) => {
    if (sourceColumnId === targetColumnId) {
      return;
    }

    if (getColumnLane(sourceColumnId) !== getColumnLane(targetColumnId)) {
      setDraggedColumnId(null);
      setDropTargetColumnId(null);
      return;
    }

    setColumnOrder((currentOrder) => {
      const knownIds = new Set(columns.map((column) => column.id));
      const nextOrder = [
        ...currentOrder.filter((columnId) => knownIds.has(columnId)),
        ...columns
          .map((column) => column.id)
          .filter((columnId) => !currentOrder.includes(columnId)),
      ];
      const sourceIndex = nextOrder.indexOf(sourceColumnId);
      const targetIndex = nextOrder.indexOf(targetColumnId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return currentOrder;
      }

      const [movedColumnId] = nextOrder.splice(sourceIndex, 1);
      const insertIndex = sourceIndex < targetIndex ? targetIndex : targetIndex;

      nextOrder.splice(insertIndex, 0, movedColumnId);
      onColumnOrderChange?.(nextOrder);
      onColumnMoved?.({
        columnId: movedColumnId,
        sourceIndex,
        targetIndex: insertIndex,
        columnIds: nextOrder,
      });

      return nextOrder;
    });
    setDraggedColumnId(null);
    setDropTargetColumnId(null);
  };

  const exportVisibleRowsToExcel = () => {
    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const headerCells = tableColumns
      .map((column) => `<th>${escapeHtml(column.headerName)}</th>`)
      .join("");
    const rowCells = tableRows
      .map(
        (row) =>
          `<tr>${tableColumns
            .map(
              (column) => `<td>${escapeHtml(getColumnValue(row, column))}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const html = `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowCells}</tbody></table>`;
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "gridnexa-export.xls";
    link.click();

    URL.revokeObjectURL(downloadUrl);
    onExport?.({ format: "excel", rows: tableRows });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumnIds((current) => {
      const next = new Set(current);

      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }

      const hiddenColumnIds = Array.from(next);
      const hidden = next.has(columnId);

      onColumnVisibilityChange?.({
        columnId,
        hidden,
        hiddenColumnIds,
      });
      onColumnVisible?.({
        columnId,
        visible: !hidden,
        hiddenColumnIds,
      });

      return next;
    });

    setPageIndex(0);
    setSelectedRowIndex(null);
    setActiveCellState(null);
    setSelectionAnchorState(null);
  };

  const resolveColumn = (idOrField: string | null | undefined) =>
    idOrField
      ? columns.find(
          (column) => column.id === idOrField || column.field === idOrField,
        )
      : undefined;

  const createAiRequest = (prompt: string): GridNexaAiRequest => ({
    prompt,
    state: {
      columns: columns.map((column) => ({
        id: column.id,
        field: String(column.field),
        headerName: column.headerName,
        type:
          typeof column.filter === "string"
            ? column.filter
            : column.filter?.type,
        hidden: hiddenColumnIds.has(column.id) || column.hidden,
        pinned: getColumnLane(column.id) ?? undefined,
      })),
      rowCount: gridRows.length,
      sampleRows: gridRows
        .slice(0, ai?.sampleRowCount ?? 8)
        .map((row) =>
          Object.fromEntries(
            columns.map((column) => [
              String(column.field),
              getColumnValue(row, column),
            ]),
          ),
        ),
      quickFilterText: quickFilterTextProp ?? quickFilterText,
      groupBy,
      pivotBy,
      pivotValueColumns,
      pivotAggregation,
      activeColumnFilters: filterModel,
      advancedFilterModel,
    },
  });

  const applyAiAction = (action: GridNexaCommandAction) => {
    if (action.type === "quickFilter") {
      setQuickFilterText(action.value);
      setPageIndex(0);
      return;
    }

    if (action.type === "setColumnFilter") {
      const column = resolveColumn(action.columnId);
      if (column) setColumnFilter(column.id, action.filter);
      return;
    }

    if (action.type === "setAdvancedFilter") {
      setAdvancedFilterModel(action.model);
      return;
    }

    if (action.type === "sort") {
      const column = resolveColumn(action.columnId);
      setSortModel(
        column && action.direction
          ? { columnId: column.id, direction: action.direction }
          : null,
      );
      setPageIndex(0);
      return;
    }

    if (action.type === "group") {
      const column = resolveColumn(action.columnId);
      updatePivotModel({ groupBy: column ? column.field : "" });
      return;
    }

    if (action.type === "pivot") {
      const groupColumn = resolveColumn(action.groupBy);
      const pivotColumn = resolveColumn(action.pivotBy);
      const valueColumns: Array<keyof T & string> = [];
      (action.valueColumns ?? []).forEach((columnId) => {
        const column = resolveColumn(columnId);
        if (column) valueColumns.push(column.field as keyof T & string);
      });

      updatePivotModel({
        groupBy:
          action.groupBy === null
            ? ""
            : (groupColumn?.field as (keyof T & string) | undefined),
        pivotBy:
          action.pivotBy === null
            ? ""
            : (pivotColumn?.field as (keyof T & string) | undefined),
        pivotValueColumns: valueColumns.length
          ? valueColumns
          : runtimePivotValueColumns,
        pivotAggregation: action.aggregation ?? runtimePivotAggregation,
      });
      return;
    }

    if (action.type === "pinColumn") {
      const column = resolveColumn(action.columnId);
      if (column) pinColumn(column.id, action.pinned);
      return;
    }

    if (action.type === "hideColumn") {
      const column = resolveColumn(action.columnId);
      if (!column) return;
      setHiddenColumnIds((current) => {
        const next = new Set(current);
        action.hidden ? next.add(column.id) : next.delete(column.id);
        return next;
      });
      setPageIndex(0);
      return;
    }

    if (action.type === "export") {
      action.format === "excel"
        ? exportVisibleRowsToExcel()
        : exportVisibleRowsToCsv();
    }
  };

  const applyAiPlan = (plan: GridNexaCommandPlan) => {
    plan.actions.forEach(applyAiAction);
    ai?.onApply?.(plan);
    setAiPlan(null);
  };

  const requestAiPlan = async () => {
    const prompt = aiPrompt.trim();

    if (!prompt || aiBusy) return;

    setAiBusy(true);
    setAiError(null);

    try {
      const request = createAiRequest(prompt);
      const result = ai?.provider
        ? await ai.provider(request)
        : ai?.endpoint
          ? await (async () => {
              const fetcher = ai.fetcher ?? fetch;
              const response = await fetcher(ai.endpoint!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
              });

              if (!response.ok) {
                throw new Error(`AI request failed with ${response.status}`);
              }

              return response.json() as Promise<
                { plan?: GridNexaCommandPlan } | GridNexaCommandPlan
              >;
            })()
          : null;
      const plan =
        result && "plan" in result ? result.plan : (result as GridNexaCommandPlan);

      if (!plan?.actions?.length) {
        throw new Error("AI did not return any grid actions.");
      }

      setAiPlan(plan);
      ai?.onPlan?.(plan);
      if (ai?.autoApply) applyAiPlan(plan);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI request failed");
      ai?.onError?.(error);
    } finally {
      setAiBusy(false);
    }
  };

  const aiEnabled = ai?.enabled ?? Boolean(ai?.provider || ai?.endpoint);
  const mergedClassNames: GridNexaSlotClassNames = classNames;

  return (
    <GridContext.Provider
      value={{
        rows: tableRows,
        columns: tableColumns,
        theme,
        classNames: mergedClassNames,
        columnTemplate: template,
        tableMinWidth,
        selectedRowIndex,
        onRowSelect: handleRowSelect,
        emitRowDoubleClick,
        selectedRowIds,
        checkboxSelection,
        allVisibleRowsSelected,
        someVisibleRowsSelected,
        getRowSelectionId,
        toggleRowSelection,
        toggleAllRowsSelection,
        rowNumbers,
        enableRowReorder,
        rowReorderPosition,
        getColumnStyle: (columnId: string) => tableColumnStyles[columnId] ?? {},
        selectionColumnStyle,
        rowNumberColumnStyle,
        getRowClassName: (params) => getRowClassName?.(params),
        getCellClassName: (params) => getCellClassName?.(params),
        getHeaderClassName: (params) => getHeaderClassName?.(params),
        emitCellClick,
        emitCellDoubleClick,
        activeCell,
        selectionAnchor,
        setActiveCell,
        setSelectionAnchor,
        moveActiveCell,
        clearSelectionAnchor,
        copySelection,
        pasteSelection,
        fillSelection,
        findMatch,
        openCellContextMenu,
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
      <div
        className={cx("sg-shell", mergedClassNames.shell, className)}
        data-gnx-theme={theme}
        data-gnx-density={density}
        onClick={closeCellContextMenu}
      >
        {toolbarVisible ? (
        <div className={cx("sg-toolbar", mergedClassNames.toolbar)}>
          {toolbarOptions.summary ? (
          <div className="sg-toolbar-copy">
            <div className={cx("sg-toolbar-subtitle", mergedClassNames.toolbarSubtitle)}>
              {rowCountLabel}
            </div>
          </div>
          ) : null}

          {toolbarOptions.ai && aiEnabled ? (
            <div className="sg-ai-command" onClick={(event) => event.stopPropagation()}>
              <form
                className="sg-ai-command-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void requestAiPlan();
                }}
              >
                <label className="sg-ai-command-input-wrap">
                  <span className="sg-filter-label">
                    {t("aiCommand", "AI command")}
                  </span>
                  <input
                    className={cx("sg-filter-input sg-ai-command-input", mergedClassNames.input)}
                    type="search"
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder={
                      ai?.placeholder ??
                      "Ask GridNexa to filter, sort, group, pivot, pin, or export"
                    }
                  />
                </label>
                <button
                  className={cx("sg-toolbar-button", mergedClassNames.button)}
                  type="submit"
                  disabled={!aiPrompt.trim() || aiBusy}
                >
                  {aiBusy ? "Thinking" : "Ask AI"}
                </button>
              </form>

              {aiError ? <div className="sg-ai-error">{aiError}</div> : null}

              {aiPlan ? (
                <div className="sg-ai-plan">
                  <div className="sg-ai-plan-copy">
                    <strong>{aiPlan.title}</strong>
                    {aiPlan.explanation ? <span>{aiPlan.explanation}</span> : null}
                  </div>
                  <div className="sg-ai-plan-actions">
                    <span>{aiPlan.actions.length} actions</span>
                    <button
                      className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                      type="button"
                      onClick={() => setAiPlan(null)}
                    >
                      Dismiss
                    </button>
                    <button
                      className={cx("sg-toolbar-button", mergedClassNames.button)}
                      type="button"
                      onClick={() => applyAiPlan(aiPlan)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={cx("sg-toolbar-actions", mergedClassNames.toolbarActions)}>
            {toolbarOptions.pagination && pageSize && pageSize > 0 ? (
              <div className="sg-pager">
                <button
                  className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
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
                  className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                  type="button"
                  onClick={goToNextPage}
                  disabled={pageIndex >= pageCount - 1}
                >
                  Next
                </button>
              </div>
            ) : null}

            {toolbarOptions.quickFilter ? (
            <label className="sg-filter">
              <span className="sg-filter-label">
                {t("quickFilter", "Quick filter")}
              </span>
              <input
                className={cx("sg-filter-input", mergedClassNames.input)}
                type="search"
                value={quickFilterText}
                onChange={(event) => setQuickFilterText(event.target.value)}
                placeholder="Search across visible columns"
                disabled={quickFilterTextProp != null}
              />
            </label>
            ) : null}

            {toolbarOptions.find ? (
            <>
            <label className="sg-filter">
              <span className="sg-filter-label">{t("find", "Find")}</span>
              <input
                className={cx("sg-filter-input sg-filter-input--short", mergedClassNames.input)}
                type="search"
                value={findText}
                onChange={(event) => setFindText(event.target.value)}
                placeholder="Find cell"
              />
            </label>

            <button
              className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
              type="button"
              onClick={() =>
                setFindMatchIndex((current) =>
                  findMatches.length ? current + 1 : current,
                )
              }
              disabled={!findMatches.length}
            >
              Next
            </button>
            </>
            ) : null}

            {toolbarOptions.undoRedo && enableUndoRedo ? (
              <>
                <button
                  className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                  type="button"
                  onClick={undo}
                  disabled={!undoStack.length}
                >
                  Undo
                </button>
                <button
                  className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                  type="button"
                  onClick={redo}
                  disabled={!redoStack.length}
                >
                  Redo
                </button>
              </>
            ) : null}

            {toolbarOptions.fillHandle && enableFillHandle ? (
              <button
                className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                type="button"
                onClick={fillSelection}
                disabled={!cellRange}
              >
                Fill
              </button>
            ) : null}

            {toolbarOptions.filters ? (
            <div className="sg-column-chooser" ref={filterPanelRef}>
              <button
                className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                type="button"
                onClick={() => setFilterPanelOpen((current) => !current)}
                aria-expanded={filterPanelOpen}
                aria-haspopup="menu"
              >
                Filters
              </button>

              {filterPanelOpen ? (
                <div
                  className={cx(
                    "sg-column-chooser-panel sg-column-chooser-panel--align-end sg-filter-panel",
                    mergedClassNames.panel,
                  )}
                  role="menu"
                  aria-label="Column filters"
                >
                  {columns
                    .filter((column) => column.filterable !== false)
                    .map((column) => {
                      const filterType = getColumnFilterType(column);
                      const filter = filterModel[column.id] ?? {
                        type: filterType,
                        operator:
                          filterType === "set"
                            ? "in"
                            : filterType === "number" || filterType === "date"
                              ? "equals"
                              : "contains",
                        value: "",
                      };
                      const uniqueValues = Array.from(
                        new Set(
                          gridRows.map((row) =>
                            String(getColumnValue(row, column) ?? ""),
                          ),
                        ),
                      ).filter(Boolean);

                      return (
                        <div className="sg-filter-panel-row" key={column.id}>
                          <span className="sg-filter-panel-label">
                            {column.headerName}
                          </span>
                          {filterType === "set" ? (
                            <select
                              className={cx("sg-filter-input", mergedClassNames.input)}
                              multiple
                              value={(filter.values ?? []).map(String)}
                              onChange={(event) => {
                                const values = Array.from(
                                  event.currentTarget.selectedOptions,
                                ).map((option) => option.value);

                                setColumnFilter(
                                  column.id,
                                  values.length
                                    ? { type: "set", operator: "in", values }
                                    : null,
                                );
                              }}
                            >
                              {uniqueValues.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <select
                                className={cx("sg-filter-operator", mergedClassNames.input)}
                                value={filter.operator}
                                onChange={(event) =>
                                  setColumnFilter(column.id, {
                                    ...filter,
                                    type: filterType,
                                    operator: event.target
                                      .value as ColumnFilterModel["operator"],
                                  })
                                }
                              >
                                {(filterType === "number"
                                  ? [
                                      "equals",
                                      "gt",
                                      "gte",
                                      "lt",
                                      "lte",
                                      "between",
                                    ]
                                  : filterType === "date"
                                    ? ["equals", "before", "after", "between"]
                                    : [
                                        "contains",
                                        "equals",
                                        "startsWith",
                                        "endsWith",
                                      ]
                                ).map((operator) => (
                                  <option key={operator} value={operator}>
                                    {operator}
                                  </option>
                                ))}
                              </select>
                              <input
                                className={cx("sg-filter-input", mergedClassNames.input)}
                                type={
                                  filterType === "number"
                                    ? "number"
                                    : filterType === "date"
                                      ? "date"
                                      : "search"
                                }
                                value={String(filter.value ?? "")}
                                onChange={(event) =>
                                  setColumnFilter(column.id, {
                                    ...filter,
                                    type: filterType,
                                    value: event.target.value,
                                  })
                                }
                              />
                              {filter.operator === "between" ? (
                                <input
                                  className={cx("sg-filter-input", mergedClassNames.input)}
                                  type={
                                    filterType === "date" ? "date" : "number"
                                  }
                                  value={String(filter.valueTo ?? "")}
                                  onChange={(event) =>
                                    setColumnFilter(column.id, {
                                      ...filter,
                                      type: filterType,
                                      valueTo: event.target.value,
                                    })
                                  }
                                />
                              ) : null}
                            </>
                          )}
                          <button
                            className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                            type="button"
                            onClick={() => setColumnFilter(column.id, null)}
                          >
                            Clear
                          </button>
                        </div>
                      );
                    })}
                </div>
              ) : null}
            </div>
            ) : null}

            {toolbarOptions.advancedFilter ? (
            <div className="sg-column-chooser" ref={advancedFilterPanelRef}>
              <button
                className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                type="button"
                onClick={() => {
                  ensureAdvancedFilterModel();
                  setAdvancedFilterPanelOpen((current) => !current);
                }}
                aria-expanded={advancedFilterPanelOpen}
                aria-haspopup="menu"
              >
                Advanced
                {activeAdvancedFilterCount ? ` (${activeAdvancedFilterCount})` : ""}
              </button>

              {advancedFilterPanelOpen ? (
                <div
                  className={cx(
                    "sg-column-chooser-panel sg-column-chooser-panel--align-end sg-advanced-filter-panel",
                    mergedClassNames.panel,
                  )}
                  role="menu"
                  aria-label="Advanced filter builder"
                >
                  <div className="sg-advanced-filter-panel-header">
                    <div>
                      <strong>Advanced filter</strong>
                      <span>Build nested AND/OR rules visually.</span>
                    </div>
                    <button
                      className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                      type="button"
                      onClick={() => setAdvancedFilterModel(null)}
                      disabled={!advancedFilterModel}
                    >
                      Clear all
                    </button>
                  </div>
                  {advancedFilterModel ? (
                    renderAdvancedFilterNode(advancedFilterModel, [])
                  ) : (
                    <button
                      className={cx("sg-toolbar-button", mergedClassNames.button)}
                      type="button"
                      onClick={() =>
                        setAdvancedFilterModel(createAdvancedFilterGroup(columns))
                      }
                    >
                      Create filter
                    </button>
                  )}
                </div>
              ) : null}
            </div>
            ) : null}

            {toolbarOptions.columns ? (
            <div className="sg-column-chooser" ref={chooserRef}>
              <button
                className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                type="button"
                onClick={() => setColumnChooserOpen((current) => !current)}
                aria-expanded={columnChooserOpen}
                aria-haspopup="menu"
              >
                Columns
              </button>

              {columnChooserOpen ? (
                <div
                  className={cx("sg-column-chooser-panel", mergedClassNames.panel)}
                  role="menu"
                  aria-label="Column chooser"
                >
                  {orderedByUserColumns.map((column) => {
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
            ) : null}

            {toolbarOptions.saveAll ? (
            <button
              className={cx("sg-toolbar-button", mergedClassNames.button)}
              type="button"
              onClick={saveAllRows}
              disabled={!onSaveAll}
            >
              Save all
            </button>
            ) : null}

            {toolbarOptions.exportCsv ? (
            <button
              className={cx("sg-toolbar-button", mergedClassNames.button)}
              type="button"
              onClick={exportVisibleRowsToCsv}
            >
              Export CSV
            </button>
            ) : null}

            {toolbarOptions.exportExcel ? (
            <button
              className={cx("sg-toolbar-button", mergedClassNames.button)}
              type="button"
              onClick={exportVisibleRowsToExcel}
            >
              Export Excel
            </button>
            ) : null}
          </div>
        </div>
        ) : null}

        <div className={cx("sg-grid-workspace", mergedClassNames.gridWorkspace)}>
          <GridRoot>
            <GridHeader
              columns={tableColumns}
              widths={tableWidths}
              mergedHeaders={mergedHeaders}
              sortModel={sortModel}
              onSort={handleSort}
              onSortDirection={handleSortDirection}
              onResizeStart={handleResizeStart}
              onAutoSize={autoSizeColumn}
              draggedColumnId={draggedColumnId}
              dropTargetColumnId={dropTargetColumnId}
              onColumnDragStart={(columnId) => {
                setDraggedColumnId(columnId);
                setDropTargetColumnId(null);
                setFilterPopoverColumnId(null);
                setColumnMenuColumnId(null);
              }}
              onColumnDragOver={(columnId) => {
                if (
                  draggedColumnId &&
                  draggedColumnId !== columnId &&
                  getColumnLane(draggedColumnId) === getColumnLane(columnId)
                ) {
                  setDropTargetColumnId(columnId);
                }
              }}
              onColumnDrop={reorderColumn}
              onColumnDragEnd={() => {
                setDraggedColumnId(null);
                setDropTargetColumnId(null);
              }}
              filterModel={filterModel}
              getColumnFilterType={getColumnFilterType}
              getColumnFilterValues={getColumnFilterValuesForColumn}
              onSetColumnFilter={setColumnFilter}
              filterPopoverColumnId={filterPopoverColumnId}
              onFilterPopoverOpenChange={(columnId, open) => {
                setFilterPopoverColumnId(open ? columnId : null);
              }}
              columnMenuColumnId={columnMenuColumnId}
              onColumnMenuOpenChange={(columnId, open) => {
                if (open) {
                  setFilterPopoverColumnId(null);
                }

                setColumnMenuColumnId(open ? columnId : null);
              }}
              onOpenFilters={openColumnFilters}
              onClearColumnFilter={clearColumnFilter}
              onPinColumn={pinColumn}
              onHideColumn={(columnId) => {
                toggleColumnVisibility(columnId);
                setColumnMenuColumnId(null);
              }}
            />
            <GridBody
              rows={displayRows}
              columns={tableColumns}
              onToggleGroup={toggleGroup}
              onToggleTreeNode={toggleTreeNode}
              onToggleDetailRow={toggleDetailRow}
              onReorderRow={reorderVisibleRows}
              onMoveRow={moveVisibleRow}
              onResetRowDragState={resetRowDragState}
              onSetDraggedRowIndex={(rowIndex) => {
                setDraggedRowIndex(rowIndex);

                if (rowIndex != null) {
                  const row = visibleDataRows[rowIndex];

                  if (row) {
                    onRowDragStart?.({ row, rowIndex });
                  }
                }
              }}
              onSetDropTargetRowIndex={setDropTargetRowIndex}
            />
          </GridRoot>

          <aside
            className={cx("sg-side-tools", mergedClassNames.sideTools)}
            ref={pivotPanelRef}
            aria-label="Grid tool panel"
          >
            <div className="sg-side-tabs" aria-label="Tool tabs">
              <button
                className={cx(
                  "sg-side-tab",
                  pivotPanelOpen && "sg-side-tab--active",
                  mergedClassNames.sideTab,
                )}
                type="button"
                aria-expanded={pivotPanelOpen}
                onClick={() => {
                  setSideFilterPanelOpen(false);
                  setPivotPanelOpen((current) => !current);
                }}
              >
                <span className="sg-side-tab-icon">▦</span>
                <span>Columns</span>
              </button>
              <button
                className={cx(
                  "sg-side-tab",
                  sideFilterPanelOpen && "sg-side-tab--active",
                  mergedClassNames.sideTab,
                )}
                type="button"
                aria-expanded={sideFilterPanelOpen}
                onClick={() => {
                  setPivotPanelOpen(false);
                  setSideFilterPanelOpen((current) => !current);
                }}
              >
                <span className="sg-side-tab-icon">≡</span>
                <span>Filters</span>
              </button>
            </div>

            {pivotPanelOpen ? (
              <div className={cx("sg-pivot-panel", mergedClassNames.panel)}>
                <div className="sg-pivot-panel-header">
                  <label className="sg-pivot-toggle">
                    <input
                      type="checkbox"
                      checked={pivotModeActive}
                      onChange={(event) => {
                        if (event.target.checked) {
                          updatePivotModel({
                            pivotBy:
                              pivotBy ??
                              (pivotCandidateColumns[0]?.field as
                                | (keyof T & string)
                                | undefined),
                            groupBy:
                              groupBy ??
                              (pivotCandidateColumns[1]?.field as
                                | (keyof T & string)
                                | undefined),
                            pivotValueColumns:
                              pivotValueColumns.length > 0
                                ? pivotValueColumns
                                : pivotValueCandidateColumns[0]?.field
                                  ? [
                                      pivotValueCandidateColumns[0]
                                        .field as keyof T & string,
                                    ]
                                  : [],
                          });
                        } else {
                          clearPivotModel();
                        }
                      }}
                    />
                    <span>Pivot Mode</span>
                  </label>
                  <button
                    className="sg-pivot-clear"
                    type="button"
                    onClick={clearPivotModel}
                    disabled={!pivotModeActive && !groupBy && !pivotValueColumns.length}
                  >
                    Reset
                  </button>
                </div>

                <label className="sg-pivot-search">
                  <span>Search columns</span>
                  <input
                    className={cx("sg-filter-input", mergedClassNames.input)}
                    type="search"
                    placeholder="Search..."
                    value={pivotToolSearch}
                    onChange={(event) => setPivotToolSearch(event.target.value)}
                  />
                </label>

                <section className="sg-pivot-section">
                  <h3>Columns</h3>
                  <div className="sg-pivot-column-list">
                    {searchedPivotColumns.map((column) => {
                      const field = column.field as keyof T & string;

                      return (
                        <label className="sg-pivot-column-item" key={column.id}>
                          <input
                            type="checkbox"
                            checked={!hiddenColumnIds.has(column.id)}
                            onChange={() => toggleColumnVisibility(column.id)}
                          />
                          <span className="sg-pivot-drag">⋮⋮</span>
                          <span>{column.headerName}</span>
                          {pivotBy === field ? (
                            <strong>Pivot</strong>
                          ) : groupBy === field ? (
                            <strong>Group</strong>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </section>

                <section className="sg-pivot-section">
                  <h3>Row Groups</h3>
                  <select
                    className={cx("sg-filter-input", mergedClassNames.input)}
                    value={groupBy ?? ""}
                    onChange={(event) =>
                      updatePivotModel({
                        groupBy: event.target.value as (keyof T & string) | "",
                      })
                    }
                  >
                    <option value="">No row group</option>
                    {pivotCandidateColumns.map((column) => (
                      <option key={column.id} value={column.field as string}>
                        {column.headerName}
                      </option>
                    ))}
                  </select>
                </section>

                <section className="sg-pivot-section">
                  <h3>Pivot Columns</h3>
                  <select
                    className={cx("sg-filter-input", mergedClassNames.input)}
                    value={pivotBy ?? ""}
                    onChange={(event) =>
                      updatePivotModel({
                        pivotBy: event.target.value as (keyof T & string) | "",
                      })
                    }
                  >
                    <option value="">Pivot off</option>
                    {pivotCandidateColumns.map((column) => (
                      <option key={column.id} value={column.field as string}>
                        {column.headerName}
                      </option>
                    ))}
                  </select>
                </section>

                <section className="sg-pivot-section">
                  <h3>Values</h3>
                  <div className="sg-pivot-values">
                    {pivotValueCandidateColumns.map((column) => {
                      const field = column.field as keyof T & string;
                      const checked = pivotValueColumns.includes(field);

                      return (
                        <label className="sg-pivot-value-item" key={column.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              updatePivotModel({
                                pivotValueColumns: checked
                                  ? pivotValueColumns.filter(
                                      (entry) => entry !== field,
                                    )
                                  : [...pivotValueColumns, field],
                              });
                            }}
                          />
                          <span>{column.headerName}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="sg-pivot-aggregation">
                    <span>Aggregation</span>
                    <select
                      className={cx("sg-filter-input", mergedClassNames.input)}
                      value={pivotAggregation}
                      onChange={(event) =>
                        updatePivotModel({
                          pivotAggregation: event.target.value as PivotAggregation,
                        })
                      }
                    >
                      {(["sum", "avg", "count", "min", "max"] as PivotAggregation[]).map(
                        (aggregation) => (
                          <option key={aggregation} value={aggregation}>
                            {aggregation}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </section>
              </div>
            ) : null}

            {sideFilterPanelOpen ? (
              <div className={cx("sg-pivot-panel sg-side-filter-panel", mergedClassNames.panel)}>
                <div className="sg-pivot-panel-header">
                  <div>
                    <strong>Filters</strong>
                    <span>Filter visible columns inside the grid.</span>
                  </div>
                  <button
                    className="sg-pivot-clear"
                    type="button"
                    onClick={() => setFilterModel({})}
                    disabled={!activeFilterCount}
                  >
                    Clear all
                  </button>
                </div>

                <div className="sg-side-filter-list">
                  {columns
                    .filter((column) => column.filterable !== false)
                    .map((column) => {
                      const filterType = getColumnFilterType(column);
                      const filter = filterModel[column.id] ?? {
                        type: filterType,
                        operator:
                          filterType === "set"
                            ? "in"
                            : filterType === "number" || filterType === "date"
                              ? "equals"
                              : "contains",
                        value: "",
                      };
                      const uniqueValues = Array.from(
                        new Set(
                          gridRows.map((row) =>
                            String(getColumnValue(row, column) ?? ""),
                          ),
                        ),
                      ).filter(Boolean);

                      return (
                        <section className="sg-pivot-section sg-side-filter-section" key={column.id}>
                          <h3>{column.headerName}</h3>
                          {filterType === "set" ? (
                            <select
                              className={cx("sg-filter-input", mergedClassNames.input)}
                              multiple
                              value={(filter.values ?? []).map(String)}
                              onChange={(event) => {
                                const values = Array.from(
                                  event.currentTarget.selectedOptions,
                                ).map((option) => option.value);

                                setColumnFilter(
                                  column.id,
                                  values.length
                                    ? { type: "set", operator: "in", values }
                                    : null,
                                );
                              }}
                            >
                              {uniqueValues.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <select
                                className={cx("sg-filter-operator", mergedClassNames.input)}
                                value={filter.operator}
                                onChange={(event) =>
                                  setColumnFilter(column.id, {
                                    ...filter,
                                    type: filterType,
                                    operator: event.target
                                      .value as ColumnFilterModel["operator"],
                                  })
                                }
                              >
                                {(filterType === "number"
                                  ? [
                                      "equals",
                                      "gt",
                                      "gte",
                                      "lt",
                                      "lte",
                                      "between",
                                    ]
                                  : filterType === "date"
                                    ? ["equals", "before", "after", "between"]
                                    : [
                                        "contains",
                                        "equals",
                                        "startsWith",
                                        "endsWith",
                                      ]
                                ).map((operator) => (
                                  <option key={operator} value={operator}>
                                    {operator}
                                  </option>
                                ))}
                              </select>
                              <input
                                className={cx("sg-filter-input", mergedClassNames.input)}
                                type={
                                  filterType === "number"
                                    ? "number"
                                    : filterType === "date"
                                      ? "date"
                                      : "search"
                                }
                                value={String(filter.value ?? "")}
                                onChange={(event) =>
                                  setColumnFilter(column.id, {
                                    ...filter,
                                    type: filterType,
                                    value: event.target.value,
                                  })
                                }
                                placeholder="Filter value"
                              />
                              {filter.operator === "between" ? (
                                <input
                                  className={cx("sg-filter-input", mergedClassNames.input)}
                                  type={
                                    filterType === "date" ? "date" : "number"
                                  }
                                  value={String(filter.valueTo ?? "")}
                                  onChange={(event) =>
                                    setColumnFilter(column.id, {
                                      ...filter,
                                      type: filterType,
                                      valueTo: event.target.value,
                                    })
                                  }
                                  placeholder="To"
                                />
                              ) : null}
                            </>
                          )}
                          <button
                            className={cx("sg-toolbar-button sg-toolbar-button--ghost", mergedClassNames.button)}
                            type="button"
                            onClick={() => setColumnFilter(column.id, null)}
                          >
                            Clear
                          </button>
                        </section>
                      );
                    })}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {cellContextMenu ? (
          <div
            className="sg-context-menu"
            role="menu"
            style={{
              left: cellContextMenu.x,
              top: cellContextMenu.y,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="sg-context-menu-item"
              type="button"
              role="menuitem"
              onClick={() => {
                void copySelection();
                closeCellContextMenu();
              }}
            >
              Copy
            </button>
            <button
              className="sg-context-menu-item"
              type="button"
              role="menuitem"
              onClick={() => void pasteFromClipboard()}
            >
              Paste
            </button>
            <button
              className="sg-context-menu-item"
              type="button"
              role="menuitem"
              onClick={startContextCellEdit}
              disabled={!contextColumn || contextColumn.editable === false}
            >
              Edit cell
            </button>
            <button
              className="sg-context-menu-item"
              type="button"
              role="menuitem"
              onClick={clearContextCell}
              disabled={!contextColumn || contextColumn.editable === false}
            >
              Clear cell
            </button>
          </div>
        ) : null}

        <div className={cx("sg-status-bar", mergedClassNames.statusBar)} role="status">
          <span>{rowCountLabel}</span>
          <span>{selectedRowsLabel}</span>
          <span>{activeCellLabel}</span>
          <span>{rangeSize ? `${rangeSize} cells selected` : "No range"}</span>
          <span>
            {activeFilterCount + activeAdvancedFilterCount} filters
          </span>
          <span>
            {sortModel ? `Sorted ${sortModel.direction}` : "Unsorted"}
          </span>
        </div>
      </div>
    </GridContext.Provider>
  );
}
