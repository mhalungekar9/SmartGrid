import { Column, type GridNexaClassName } from "./Column";
import type { GridNexaAiOptions } from "../types/GridCommand";

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

export type AdvancedFilterJoinOperator = "and" | "or";

export interface AdvancedFilterRuleModel {
  id?: string;
  kind: "rule";
  columnId: string;
  operator: ColumnFilterOperator;
  value?: unknown;
  valueTo?: unknown;
  values?: unknown[];
}

export interface AdvancedFilterGroupModel {
  id?: string;
  kind: "group";
  joinOperator: AdvancedFilterJoinOperator;
  conditions: AdvancedFilterModel[];
}

export type AdvancedFilterModel =
  | AdvancedFilterRuleModel
  | AdvancedFilterGroupModel;

export type AdvancedFilter<T = unknown> = (row: T) => boolean;
export type ExternalFilter<T = unknown> = (row: T) => boolean;
export type PivotAggregation = "sum" | "avg" | "count" | "min" | "max";
export type GridNexaTheme = "light" | "dark" | "system";
export type GridNexaDensity = "compact" | "standard" | "comfortable";
export type GridNexaSlotClassNames = Partial<{
  shell: GridNexaClassName;
  toolbar: GridNexaClassName;
  toolbarTitle: GridNexaClassName;
  toolbarSubtitle: GridNexaClassName;
  toolbarActions: GridNexaClassName;
  button: GridNexaClassName;
  input: GridNexaClassName;
  gridWorkspace: GridNexaClassName;
  gridRoot: GridNexaClassName;
  header: GridNexaClassName;
  headerRow: GridNexaClassName;
  mergedHeaderRow: GridNexaClassName;
  mergedHeaderCell: GridNexaClassName;
  headerCell: GridNexaClassName;
  row: GridNexaClassName;
  cell: GridNexaClassName;
  statusBar: GridNexaClassName;
  sideTools: GridNexaClassName;
  sideTab: GridNexaClassName;
  panel: GridNexaClassName;
}>;

export interface ServerSideOperationState<T = unknown> {
  sortModel?: Array<{ columnId: string; direction: "asc" | "desc" }>;
  filterModel?: Record<string, ColumnFilterModel>;
  advancedFilterModel?: AdvancedFilterModel | null;
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

export interface MergedHeader {
  id: string;
  headerName: string;
  columnIds: string[];
  align?: "left" | "center" | "right";
}

export interface GridOptions<T = unknown> {
  columns: Column<T>[];
  rows: T[];
  className?: string;
  theme?: GridNexaTheme;
  density?: GridNexaDensity;
  unstyled?: boolean;
  classNames?: GridNexaSlotClassNames;
  getRowClassName?: (params: {
    row: T;
    rowIndex: number;
    selected: boolean;
  }) => GridNexaClassName;
  getCellClassName?: (params: {
    value: unknown;
    row: T;
    rowIndex: number;
    column: Column<T>;
    columnIndex: number;
    selected: boolean;
  }) => GridNexaClassName;
  getHeaderClassName?: (params: { column: Column<T>; columnIndex: number }) => GridNexaClassName;
  mergedHeaders?: MergedHeader[];
  columnFilters?: Record<string, ColumnFilterModel>;
  quickFilterText?: string;
  externalFilter?: ExternalFilter<T>;
  advancedFilter?: AdvancedFilter<T>;
  advancedFilterModel?: AdvancedFilterModel | null;
  onAdvancedFilterModelChange?: (model: AdvancedFilterModel | null) => void;
  rowNumbers?: boolean;
  checkboxSelection?: boolean;
  enableRangeSelection?: boolean;
  enableFillHandle?: boolean;
  enableUndoRedo?: boolean;
  localeText?: Record<string, string>;
  getRowId?: (row: T, index: number) => string | number;
  onRowSelectionChange?: (selectedRows: T[]) => void;
  pivotBy?: keyof T & string;
  pivotValueColumns?: Array<keyof T & string>;
  pivotAggregation?: PivotAggregation;
  onPivotModelChange?: (model: {
    groupBy?: keyof T & string;
    pivotBy?: keyof T & string;
    pivotValueColumns: Array<keyof T & string>;
    pivotAggregation: PivotAggregation;
  }) => void;
  getTreeDataPath?: (row: T) => string[];
  masterDetailRenderer?: (row: T) => unknown;
  transaction?: GridTransaction<T>;
  ai?: GridNexaAiOptions;
  onCellValueChange?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    oldValue: unknown;
    newValue: unknown;
  }) => void;
  onServerSideOperation?: (state: ServerSideOperationState<T>) => void;
}
