import { Column } from "./Column";

export type ColumnFilterOperator =
  | "contains"
  | "equals"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "before"
  | "after"
  | "between"
  | "in"
  | "blank"
  | "notBlank";

export interface ColumnFilterModel {
  type?: "text" | "number" | "date" | "set" | "multi";
  operator: ColumnFilterOperator;
  value?: unknown;
  valueTo?: unknown;
  values?: unknown[];
  conditions?: ColumnFilterModel[];
  joinOperator?: "and" | "or";
}

export type AdvancedFilter<T = unknown> = (row: T) => boolean;
export type ExternalFilter<T = unknown> = (row: T) => boolean;
export type PivotAggregation = "sum" | "avg" | "count" | "min" | "max";

export interface ServerSideOperationState<T = unknown> {
  sortModel?: Array<{ columnId: string; direction: "asc" | "desc" }>;
  filterModel?: Record<string, ColumnFilterModel>;
  selectedRowIds?: Array<string | number>;
  pageIndex?: number;
  pageSize?: number;
  groupBy?: keyof T & string;
  pivotBy?: keyof T & string;
  pivotValueColumns?: Array<keyof T & string>;
  pivotAggregation?: PivotAggregation;
  treeData?: boolean;
  masterDetail?: boolean;
  transaction?: GridTransaction<T>;
}

export interface GridTransaction<T = unknown> {
  add?: T[];
  update?: T[];
  remove?: T[];
}

export interface GridOptions<T = unknown> {
  columns: Column<T>[];
  rows: T[];
  columnFilters?: Record<string, ColumnFilterModel>;
  quickFilterText?: string;
  externalFilter?: ExternalFilter<T>;
  advancedFilter?: AdvancedFilter<T>;
  rowNumbers?: boolean;
  enableRangeSelection?: boolean;
  enableFillHandle?: boolean;
  enableUndoRedo?: boolean;
  localeText?: Record<string, string>;
  getRowId?: (row: T, index: number) => string | number;
  pivotBy?: keyof T & string;
  pivotValueColumns?: Array<keyof T & string>;
  pivotAggregation?: PivotAggregation;
  getTreeDataPath?: (row: T) => string[];
  masterDetailRenderer?: (row: T) => unknown;
  transaction?: GridTransaction<T>;
  onCellValueChange?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    oldValue: unknown;
    newValue: unknown;
  }) => void;
  onServerSideOperation?: (state: ServerSideOperationState<T>) => void;
}
