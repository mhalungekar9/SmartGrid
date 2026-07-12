import {
  Column,
  type GridNexaClassName,
  type GridNexaColumnToolOptions,
  type GridNexaTextDisplayOptions,
} from "./Column";
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
export type GridNexaRowReorderPosition = "left" | "right";
export type GridNexaPreset = "basic" | "admin" | "spreadsheet" | "analytics";
export type GridNexaChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "bubble"
  | "radar"
  | "radialBar"
  | "histogram"
  | "boxPlot"
  | "treemap"
  | "gauge"
  | "funnel"
  | "combo";
export type GridNexaChartsOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      toolbarButton: boolean;
      types: GridNexaChartType[];
      source: "selection" | "visibleRows";
      defaultType: GridNexaChartType;
      maxRows: number;
    }>;
export type GridNexaToolbarOptions =
  | boolean
  | Partial<{
      summary: boolean;
      pagination: boolean;
      quickFilter: boolean;
      find: boolean;
      undoRedo: boolean;
      fillHandle: boolean;
      fill: boolean;
      filters: boolean;
      advancedFilter: boolean;
      columns: boolean;
      columnSelector: boolean;
      exportCsv: boolean;
      exportExcel: boolean;
      importData: boolean;
      copyPaste: boolean;
      bulkEdit: boolean;
      findReplace: boolean;
      charts: boolean;
      dataHealth: boolean;
      trustMode: boolean;
      prevNextPage: boolean;
      saveAll: boolean;
      addRow: boolean;
      deleteRow: boolean;
      deleteSelectedRows: boolean;
      ai: boolean;
    }>;
export type GridNexaFooterOptions =
  | boolean
  | Partial<{
      rowCount: boolean;
      selectedRows: boolean;
      selectedCell: boolean;
      selectedRange: boolean;
      filterCount: boolean;
      sortStatus: boolean;
      pagination: boolean;
      renderer: (state: {
        rowCountLabel: string;
        selectedRowsLabel: string;
        activeCellLabel: string;
        selectedRangeLabel: string;
        filterCountLabel: string;
        sortStatusLabel: string;
        pageIndex: number;
        pageCount: number;
      }) => unknown;
    }>;
export type GridNexaSidePanelActivePanel = "columns" | "pivot" | "filters";
export type GridNexaSidePanelOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      columns: boolean;
      pivot: boolean;
      filters: boolean;
      defaultActivePanel: GridNexaSidePanelActivePanel | null;
    }>;
export type GridNexaFillWidthMode = "flex" | "lastColumn" | "flexOrLast";
export type GridNexaFillWidthOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      mode: GridNexaFillWidthMode;
    }>;
export type GridNexaPersistedStateKey =
  | "columns"
  | "filters"
  | "sort"
  | "pagination"
  | "sidePanel";
export type GridNexaStateStorageOptions =
  | boolean
  | Partial<{
      key: string;
      type: "localStorage";
      persist: GridNexaPersistedStateKey[];
    }>;
export type GridNexaSummaryOptions =
  | boolean
  | Partial<{
      footer: boolean;
      selectedRange: boolean;
    }>;
export type GridNexaSavedViewsOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      key: string;
      storage: "localStorage";
      allowUserViews: boolean;
    }>;
export type GridNexaCommandPaletteOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      shortcut: string;
    }>;
export type GridNexaChangeReviewOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      showToolbarButton: boolean;
    }>;
export type GridNexaValidationRule =
  | boolean
  | {
      required?: boolean;
      min?: number;
      max?: number;
      pattern?: string | RegExp;
      type?: "email" | "number" | "text";
      validate?: (value: unknown, row: unknown) => true | string;
      message?: string;
    };
export type GridNexaValidationOptions =
  | boolean
  | Partial<{
      rules: Record<string, GridNexaValidationRule>;
      showSummary: boolean;
      blockSave: boolean;
    }>;
export type GridNexaDiagnosticsOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      showPanel: boolean;
      recorder: boolean;
      exportRepro: boolean;
      maxEvents: number;
      rowSampleSize: number;
      fileName: string;
    }>;
export type GridNexaDataHealthOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      showPanel: boolean;
      toolbarButton: boolean;
      duplicateThreshold: number;
      outlierIqrMultiplier: number;
    }>;
export type GridNexaTrustModeOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      showPanel: boolean;
      toolbarButton: boolean;
      trackEdits: boolean;
      allowRollback: boolean;
      showImpact: boolean;
      maxEvents: number;
    }>;
export type GridNexaCollaborationUser = {
  id: string | number;
  name: string;
  color?: string;
};
export type GridNexaCollaborationCellEvent = {
  type: "cell-change" | "cell-lock" | "cell-unlock" | "presence";
  user: GridNexaCollaborationUser;
  rowId: string | number;
  rowIndex?: number;
  columnId: string;
  field?: string;
  value?: unknown;
  version?: number;
  timestamp?: number;
};
export type GridNexaCollaborationProvider = {
  subscribe?: (
    handler: (event: GridNexaCollaborationCellEvent) => void,
  ) => void | (() => void);
  publish?: (event: GridNexaCollaborationCellEvent) => void | Promise<void>;
  lockCell?: (event: GridNexaCollaborationCellEvent) => boolean | Promise<boolean>;
  unlockCell?: (event: GridNexaCollaborationCellEvent) => void | Promise<void>;
};
export type GridNexaCollaborationOptions =
  | boolean
  | Partial<{
      enabled: boolean;
      user: GridNexaCollaborationUser;
      provider: GridNexaCollaborationProvider;
      showPresence: boolean;
      conflictMode: "cell-lock" | "last-write-wins" | "versioned";
    }>;
export interface GridNexaIconSet {
  sortAsc?: unknown;
  sortDesc?: unknown;
  filter?: unknown;
  menu?: unknown;
  columnTools?: unknown;
  resize?: unknown;
  pinLeft?: unknown;
  pinRight?: unknown;
  unpin?: unknown;
  hideColumn?: unknown;
  autoSize?: unknown;
  clear?: unknown;
  treeExpand?: unknown;
  treeCollapse?: unknown;
  detailExpand?: unknown;
  detailCollapse?: unknown;
  checkboxChecked?: unknown;
  checkboxUnchecked?: unknown;
  checkboxIndeterminate?: unknown;
  pagePrevious?: unknown;
  pageNext?: unknown;
  addRow?: unknown;
  deleteRow?: unknown;
  exportCsv?: unknown;
  exportExcel?: unknown;
  saveAll?: unknown;
  undo?: unknown;
  redo?: unknown;
  fill?: unknown;
  columns?: unknown;
  advancedFilter?: unknown;
  quickFilter?: unknown;
  find?: unknown;
}
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

export type GridNexaRowsChangeReason =
  | "edit"
  | "fill"
  | "paste"
  | "import"
  | "replace"
  | "bulkEdit"
  | "clear"
  | "rowReorder"
  | "rowAdd"
  | "rowDelete"
  | "rowsDelete"
  | "transaction"
  | "undo"
  | "redo";

export interface GridNexaApi<T = unknown> {
  getRows: () => T[];
  setRows: (rows: T[]) => void;
  addRow: (row?: T) => void;
  deleteRow: (rowIndex: number) => void;
  deleteSelectedRows: () => void;
  exportDiagnostics: () => void;
  saveAll: () => void;
}

export interface GridNexaCellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface GridNexaCellRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface GridNexaReproSnapshot<T = unknown> {
  schemaVersion?: number;
  packageName?: string;
  generatedAt?: string;
  columns?: Column<T>[];
  rows?: T[];
  visibleRows?: T[];
  state?: Partial<{
    columnOrder: string[];
    columnWidths: Record<string, number>;
    hiddenColumnIds: string[];
    pinnedColumnIds: Record<string, "left" | "right" | null>;
    filterModel: Record<string, ColumnFilterModel>;
    sortModel: { columnId: string; direction: "asc" | "desc" } | null;
    pageIndex: number;
    sidePanel: {
      columnsOpen?: boolean;
      filtersOpen?: boolean;
    };
    groupBy: keyof T & string;
    pivotBy: keyof T & string;
    pivotValueColumns: Array<keyof T & string>;
    pivotAggregation: PivotAggregation;
    selectedRowIndex: number | null;
    selectedRowIds: Array<string | number>;
    activeCell: GridNexaCellPosition | null;
    cellRange: GridNexaCellRange | null;
    quickFilterText: string;
    findText: string;
  }>;
  changeReview?: unknown[];
  events?: unknown[];
  reactExample?: string;
}

export interface GridOptions<T = unknown> {
  columns: Column<T>[];
  rows: T[];
  repro?: GridNexaReproSnapshot<T>;
  className?: string;
  theme?: GridNexaTheme;
  density?: GridNexaDensity;
  height?: number | string;
  unstyled?: boolean;
  classNames?: GridNexaSlotClassNames;
  preset?: GridNexaPreset;
  columnTools?: GridNexaColumnToolOptions;
  icons?: GridNexaIconSet;
  textDisplay?: GridNexaTextDisplayOptions;
  createRow?: () => T;
  apiRef?: { current: GridNexaApi<T> | null };
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
  enableRowReorder?: boolean;
  rowReorderPosition?: GridNexaRowReorderPosition;
  toolbar?: GridNexaToolbarOptions;
  footer?: GridNexaFooterOptions;
  summaries?: GridNexaSummaryOptions;
  views?: GridNexaSavedViewsOptions;
  commandPalette?: GridNexaCommandPaletteOptions;
  changeReview?: GridNexaChangeReviewOptions;
  validation?: GridNexaValidationOptions;
  diagnostics?: GridNexaDiagnosticsOptions;
  dataHealth?: GridNexaDataHealthOptions;
  trustMode?: GridNexaTrustModeOptions;
  collaboration?: GridNexaCollaborationOptions;
  charts?: GridNexaChartsOptions;
  sidePanel?: GridNexaSidePanelOptions;
  fillWidth?: GridNexaFillWidthOptions;
  stateStorage?: GridNexaStateStorageOptions;
  loading?: boolean;
  error?: unknown;
  emptyState?: unknown;
  localeText?: Record<string, string>;
  getRowId?: (row: T, index: number) => string | number;
  onGridReady?: (params: { rows: T[]; columns: Column<T>[] }) => void;
  onRowsChange?: (params: {
    rows: T[];
    previousRows: T[];
    reason: GridNexaRowsChangeReason;
  }) => void;
  onDataChange?: (params: {
    rows: T[];
    previousRows: T[];
    reason: GridNexaRowsChangeReason;
  }) => void;
  onRowAdd?: (params: { row: T; rowIndex: number; rows: T[] }) => void;
  onRowDelete?: (params: {
    row: T;
    rowIndex: number;
    rows: T[];
    remainingRows: T[];
  }) => void;
  onRowsDelete?: (params: {
    rows: T[];
    rowIndexes: number[];
    remainingRows: T[];
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
  onRowSelectionChange?: (selectedRows: T[]) => void;
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
  onRangeSelectionChange?: (range: GridNexaCellRange | null) => void;
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
  onCopy?: (params: { text: string; range: GridNexaCellRange | null }) => void;
  onPaste?: (params: { text: string }) => void;
  onFill?: (params: { range: GridNexaCellRange; value: unknown }) => void;
  onExport?: (params: { format: "csv" | "excel"; rows: T[] }) => void;
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
