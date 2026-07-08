import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from "@angular/core";
import type {
  AdvancedFilterModel,
  Column,
  ColumnFilterModel,
  GridOptions,
  GridNexaClassName,
  GridNexaPreset,
  GridNexaStateStorageOptions,
  GridNexaSummaryOptions,
  GridNexaAiOptions,
  GridNexaAiRequest,
  GridNexaCommandAction,
  GridNexaCommandPlan,
  GridTransaction,
  MergedHeader,
  PivotAggregation,
  ServerSideOperationState,
} from "@gridnexa/core";

export * from "@gridnexa/core";

export interface GridNexaAngularOptions<T = Record<string, unknown>>
  extends GridOptions<T> {
  pageSize?: number;
  groupBy?: keyof T & string;
}

type SortState = { columnId: string; direction: "asc" | "desc" } | null;
type CellPoint = { rowIndex: number; columnId: string };
type PersistedGridState = {
  columnWidths?: Record<string, number>;
  hiddenColumnIds?: string[];
  pinnedColumnIds?: Record<string, "left" | "right" | undefined>;
  sortModel?: SortState;
  filterModel?: Record<string, ColumnFilterModel>;
  pageIndex?: number;
};
type CellEdit<T> = {
  row: T;
  rowIndex: number;
  column: Column<T>;
  oldValue: unknown;
  newValue: unknown;
};
type DisplayRow<T> =
  | { kind: "group"; key: string; label: string; rows: T[]; summaries: string }
  | { kind: "data"; row: T; rowIndex: number; depth?: number; treeKey?: string; hasChildren?: boolean };

function rawValue<T>(row: T, column: Column<T>) {
  return column.valueGetter ? column.valueGetter(row) : row[column.field];
}

function evaluateFormula<T>(row: T, columns: Column<T>[], expression: string) {
  const formula = expression.trim().slice(1);
  if (!/^[\w\s.+\-*/()%]+$/.test(formula)) return expression;

  const resolved = columns.reduce((current, column) => {
    const value = Number(rawValue(row, column));
    return current.replace(
      new RegExp(`\\b${column.id}\\b|\\b${String(column.field)}\\b`, "g"),
      Number.isFinite(value) ? String(value) : "0",
    );
  }, formula);

  try {
    return Function(`"use strict"; return (${resolved});`)();
  } catch {
    return expression;
  }
}

function value<T>(row: T, column: Column<T>, columns: Column<T>[]) {
  const current = rawValue(row, column);
  return typeof current === "string" && current.trim().startsWith("=")
    ? evaluateFormula(row, columns, current)
    : current;
}

function format<T>(row: T, column: Column<T>, columns: Column<T>[]) {
  const current = value(row, column, columns);
  return column.valueFormatter ? column.valueFormatter(current) : String(current ?? "");
}

function buildSummaryLabel(values: unknown[], emptyLabel: string) {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (!numbers.length) return emptyLabel;
  const sum = numbers.reduce((total, entry) => total + entry, 0);
  const average = sum / numbers.length;
  const formatNumber = (entry: number) =>
    Number.isInteger(entry)
      ? entry.toLocaleString()
      : entry.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `Count ${numbers.length} | Sum ${formatNumber(sum)} | Avg ${formatNumber(average)} | Min ${formatNumber(Math.min(...numbers))} | Max ${formatNumber(Math.max(...numbers))}`;
}

function matches<T>(row: T, column: Column<T>, filter: ColumnFilterModel, columns: Column<T>[]) {
  const raw = value(row, column, columns);
  const text = String(raw ?? "").toLowerCase();
  const needle = String(filter.value ?? "").toLowerCase();
  const numeric = Number(raw);
  const from = Number(filter.value);
  const to = Number(filter.valueTo);

  if (filter.operator === "blank") return !text.trim();
  if (filter.operator === "notBlank") return Boolean(text.trim());
  if (filter.operator === "in") return (filter.values ?? []).map(String).includes(String(raw ?? ""));
  if (!needle && filter.operator !== "between") return true;
  if (filter.operator === "equals") return text === needle;
  if (filter.operator === "startsWith") return text.startsWith(needle);
  if (filter.operator === "endsWith") return text.endsWith(needle);
  if (filter.operator === "gt") return numeric > from;
  if (filter.operator === "gte") return numeric >= from;
  if (filter.operator === "lt") return numeric < from;
  if (filter.operator === "lte") return numeric <= from;
  if (filter.operator === "between") return numeric >= from && numeric <= to;
  return text.includes(needle);
}

function activeAdvanced(model?: AdvancedFilterModel | null): boolean {
  if (!model) return false;
  if (model.kind === "group") return model.conditions.some(activeAdvanced);
  if (model.operator === "blank" || model.operator === "notBlank") return true;
  if (model.operator === "in") return Boolean(model.values?.length);
  return model.value != null && String(model.value).trim() !== "";
}

function matchesAdvanced<T>(row: T, columns: Column<T>[], model?: AdvancedFilterModel | null): boolean {
  if (!model || !activeAdvanced(model)) return true;
  if (model.kind === "group") {
    const active = model.conditions.filter(activeAdvanced);
    return model.joinOperator === "or"
      ? active.some((condition) => matchesAdvanced(row, columns, condition))
      : active.every((condition) => matchesAdvanced(row, columns, condition));
  }
  const column = columns.find((entry) => entry.id === model.columnId);
  return column ? matches(row, column, { operator: model.operator, value: model.value, valueTo: model.valueTo, values: model.values }, columns) : true;
}

function aggregate(values: unknown[], aggregation: PivotAggregation) {
  if (aggregation === "count") return values.length;
  const numbers = values.map(Number).filter((entry) => !Number.isNaN(entry));
  if (!numbers.length) return 0;
  if (aggregation === "avg") return numbers.reduce((sum, entry) => sum + entry, 0) / numbers.length;
  if (aggregation === "min") return Math.min(...numbers);
  if (aggregation === "max") return Math.max(...numbers);
  return numbers.reduce((sum, entry) => sum + entry, 0);
}

function buildPivot<T>(
  rows: T[],
  columns: Column<T>[],
  groupBy?: keyof T & string,
  pivotBy?: keyof T & string,
  pivotValueColumns?: Array<keyof T & string>,
  pivotAggregation: PivotAggregation = "sum",
) {
  if (!pivotBy) return { columns, rows, active: false };
  const valueFields = pivotValueColumns?.length
    ? pivotValueColumns
    : columns.filter((column) => rows.some((row) => typeof value(row, column, columns) === "number")).map((column) => column.field as keyof T & string);
  const pivotLabels = Array.from(new Set(rows.map((row) => String(row[pivotBy] ?? "Blank"))));
  const groupLabels = Array.from(new Set(rows.map((row) => String(groupBy ? row[groupBy] : "Total"))));
  const pivotColumns: Column<Record<string, unknown>>[] = [
    { id: "__group", field: "__group", headerName: groupBy ?? "Group", width: 180 },
    ...pivotLabels.flatMap((label) =>
      valueFields.map((field) => ({
        id: `${label}_${String(field)}`,
        field: `${label}_${String(field)}`,
        headerName: `${label} ${String(field)}`,
        width: 140,
      })),
    ),
  ];
  const pivotRows = groupLabels.map((group) => {
    const output: Record<string, unknown> = { __group: group };
    pivotLabels.forEach((pivot) => {
      const bucket = rows.filter((row) => String(row[pivotBy] ?? "Blank") === pivot && String(groupBy ? row[groupBy] : "Total") === group);
      valueFields.forEach((field) => {
        output[`${pivot}_${String(field)}`] = aggregate(bucket.map((row) => row[field]), pivotAggregation);
      });
    });
    return output;
  });
  return { columns: pivotColumns as Column<T>[], rows: pivotRows as T[], active: true };
}

function buildGroupSummary<T>(rows: T[], columns: Column<T>[], groupBy?: keyof T & string) {
  return columns
    .filter((column) => column.field !== groupBy)
    .map((column) => {
      const values = rows.map((row) => Number(value(row, column, columns))).filter(Number.isFinite);
      return values.length ? `${column.headerName}: ${values.reduce((sum, entry) => sum + entry, 0).toLocaleString()}` : "";
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(" | ");
}

function cell(text: string, tag: "td" | "th" = "td") {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function classNameList(...values: GridNexaClassName[]) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(" ");
}

function resolveClassName<T>(
  value: GridNexaClassName | ((params: { value: unknown; row: T; rowIndex: number; column: Column<T> }) => GridNexaClassName),
  params: { value: unknown; row: T; rowIndex: number; column: Column<T> },
) {
  return typeof value === "function" ? value(params) : value;
}

const defaultColumnTools = {
  sort: true,
  filter: true,
  filterPanel: true,
  menu: true,
  resize: true,
  pin: true,
  hide: true,
  autosize: true,
  columnSelector: true,
};

function resolveToolOptions<T>(globalTools: unknown, column?: Column<T>) {
  const apply = (current: typeof defaultColumnTools, value: unknown) => {
    if (value === undefined) return current;
    if (typeof value === "boolean") return Object.fromEntries(Object.keys(current).map((key) => [key, value])) as typeof defaultColumnTools;
    return { ...current, ...(value as Partial<typeof defaultColumnTools>) };
  };

  return apply(apply(defaultColumnTools, globalTools), (column as Column<T> & { tools?: unknown } | undefined)?.tools);
}

function resolveTextDisplay<T>(globalDisplay: unknown, column: Column<T>) {
  return {
    overflow: "ellipsis" as const,
    showTooltip: true,
    ...((globalDisplay ?? {}) as object),
    ...(((column as Column<T> & { textDisplay?: object }).textDisplay ?? {}) as object),
  } as { overflow?: "ellipsis" | "wrap" | "clip"; showTooltip?: boolean };
}

function estimateWidth(value: unknown) {
  return String(value ?? "").length * 8 + 44;
}

function resolvePresetDefaults<T>(preset?: GridNexaPreset): Partial<GridNexaAngularOptions<T>> {
  if (preset === "admin") {
    return {
      rowNumbers: true,
      checkboxSelection: true,
      enableRangeSelection: true,
      enableUndoRedo: true,
      toolbar: {
        summary: true,
        quickFilter: true,
        find: true,
        filters: true,
        advancedFilter: true,
        columns: true,
        exportCsv: true,
        exportExcel: true,
        saveAll: true,
        addRow: true,
        deleteSelectedRows: true,
      },
      footer: true,
      sidePanel: true,
      fillWidth: true,
    };
  }
  if (preset === "spreadsheet") {
    return {
      rowNumbers: true,
      checkboxSelection: true,
      enableRangeSelection: true,
      enableFillHandle: true,
      enableUndoRedo: true,
      enableRowReorder: true,
      toolbar: {
        quickFilter: true,
        find: true,
        undoRedo: true,
        fill: true,
        addRow: true,
        deleteSelectedRows: true,
        exportCsv: true,
        exportExcel: true,
      },
      footer: true,
      sidePanel: { enabled: true, columns: true, pivot: false, filters: true },
      fillWidth: true,
    };
  }
  if (preset === "analytics") {
    return {
      rowNumbers: true,
      toolbar: {
        summary: true,
        quickFilter: true,
        filters: true,
        advancedFilter: true,
        columns: true,
        exportCsv: true,
        exportExcel: true,
      },
      footer: true,
      sidePanel: { enabled: true, columns: true, pivot: true, filters: true, defaultActivePanel: "columns" },
      fillWidth: true,
    };
  }
  if (preset === "basic") return { toolbar: false, footer: true, sidePanel: false, fillWidth: true };
  return {};
}

function resolveStateStorageOptions(value?: GridNexaStateStorageOptions) {
  if (!value || typeof value !== "object" || !value.key || value.type !== "localStorage") return null;
  return {
    key: value.key,
    persist: value.persist ?? ["columns", "filters", "sort", "pagination", "sidePanel"],
  };
}

function resolveSummaryOptions(value?: GridNexaSummaryOptions) {
  return {
    footer: false,
    selectedRange: false,
    ...(value === true ? { footer: true, selectedRange: true } : {}),
    ...(value && typeof value === "object" ? value : {}),
  };
}

function readPersistedGridState(value?: GridNexaStateStorageOptions): PersistedGridState | null {
  const options = resolveStateStorageOptions(value);
  if (!options || typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(options.key);
    return raw ? (JSON.parse(raw) as PersistedGridState) : null;
  } catch {
    return null;
  }
}

function writePersistedGridState(value: GridNexaStateStorageOptions | undefined, state: PersistedGridState) {
  const options = resolveStateStorageOptions(value);
  if (!options || typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(options.key, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

@Component({
  selector: "grid-nexa",
  standalone: true,
  template: "<div #host class=\"gridnexa-angular-host\"></div>",
})
export class GridNexaAngularComponent<T = Record<string, unknown>>
  implements AfterViewInit, OnChanges
{
  @Input({ required: true }) columns: Column<T>[] = [];
  @Input({ required: true }) rows: T[] = [];
  @Input() className: string | undefined;
  @Input() theme: GridNexaAngularOptions<T>["theme"] = "dark";
  @Input() density: GridNexaAngularOptions<T>["density"] = "standard";
  @Input() height: number | string | undefined;
  @Input() unstyled = false;
  @Input() classNames: GridNexaAngularOptions<T>["classNames"] = {};
  @Input() preset: GridNexaPreset | undefined;
  @Input() stateStorage: GridNexaStateStorageOptions | undefined;
  @Input() summaries: GridNexaSummaryOptions | undefined;
  @Input() loading = false;
  @Input() error: unknown;
  @Input() emptyState: unknown;
  @Input() toolbar: GridNexaAngularOptions<T>["toolbar"] = undefined;
  @Input() footer: GridNexaAngularOptions<T>["footer"] = undefined;
  @Input() sidePanel: GridNexaAngularOptions<T>["sidePanel"] = undefined;
  @Input() fillWidth: GridNexaAngularOptions<T>["fillWidth"] = undefined;
  @Input() columnTools: unknown;
  @Input() icons: Record<string, unknown> | undefined;
  @Input() textDisplay: unknown;
  @Input() createRow: (() => T) | undefined;
  @Input() apiRef: { current: unknown } | undefined;
  @Input() getRowClassName: GridNexaAngularOptions<T>["getRowClassName"];
  @Input() getCellClassName: GridNexaAngularOptions<T>["getCellClassName"];
  @Input() getHeaderClassName: GridNexaAngularOptions<T>["getHeaderClassName"];
  @Input() mergedHeaders: MergedHeader[] | undefined;
  @Input() rowNumbers = false;
  @Input() checkboxSelection = false;
  @Input() enableRangeSelection = true;
  @Input() enableFillHandle = true;
  @Input() enableUndoRedo = true;
  @Input() enableRowReorder = false;
  @Input() rowReorderPosition: GridNexaAngularOptions<T>["rowReorderPosition"] = "right";
  @Input() quickFilterText = "";
  @Input() columnFilters: Record<string, ColumnFilterModel> | undefined;
  @Input() externalFilter: GridNexaAngularOptions<T>["externalFilter"];
  @Input() advancedFilter: GridNexaAngularOptions<T>["advancedFilter"];
  @Input() advancedFilterModel: AdvancedFilterModel | null | undefined;
  @Input() pageSize: number | undefined;
  @Input() groupBy: keyof T & string | undefined;
  @Input() pivotBy: keyof T & string | undefined;
  @Input() pivotValueColumns: Array<keyof T & string> | undefined;
  @Input() pivotAggregation: PivotAggregation = "sum";
  @Input() getRowId: GridNexaAngularOptions<T>["getRowId"];
  @Input() getTreeDataPath: GridNexaAngularOptions<T>["getTreeDataPath"];
  @Input() masterDetailRenderer: GridNexaAngularOptions<T>["masterDetailRenderer"];
  @Input() transaction: GridTransaction<T> | undefined;
  @Input() localeText: Record<string, string> | undefined;
  @Input() ai: GridNexaAiOptions | undefined;

  @Output() rowSelectionChange = new EventEmitter<T[]>();
  @Output() selectionChanged = new EventEmitter<{
    selectedRows: T[];
    selectedRowIds: Array<string | number>;
  }>();
  @Output() rowSelected = new EventEmitter<{
    row: T;
    rowIndex: number;
    selected: boolean;
    selectedRows: T[];
  }>();
  @Output() selectedRowChange = new EventEmitter<{
    row: T | null;
    rowIndex: number | null;
    selectedRows: T[];
  }>();
  @Output() rowOrderChange = new EventEmitter<{
    rows: T[];
    movedRow: T;
    sourceIndex: number;
    targetIndex: number;
  }>();
  @Output() cellClick = new EventEmitter<{ row: T; rowIndex: number; column: Column<T> }>();
  @Output() cellDoubleClick = new EventEmitter<{ row: T; rowIndex: number; column: Column<T> }>();
  @Output() cellValueChange = new EventEmitter<{
    row: T;
    rowIndex: number;
    column: Column<T>;
    oldValue: unknown;
    newValue: unknown;
  }>();
  @Output() cellEditStart = new EventEmitter<{ row: T; rowIndex: number; column: Column<T>; value: unknown }>();
  @Output() cellEditStop = new EventEmitter<{
    row: T;
    rowIndex: number;
    column: Column<T>;
    oldValue: unknown;
    newValue: unknown;
  }>();
  @Output() sortChanged = new EventEmitter<Array<{ columnId: string; direction: "asc" | "desc" }>>();
  @Output() filterChanged = new EventEmitter<Record<string, ColumnFilterModel>>();
  @Output() columnMoved = new EventEmitter<{
    columnId: string;
    sourceIndex: number;
    targetIndex: number;
    columnIds: string[];
  }>();
  @Output() columnResized = new EventEmitter<{ columnId: string; width: number }>();
  @Output() columnVisible = new EventEmitter<{
    columnId: string;
    visible: boolean;
    hiddenColumnIds: string[];
  }>();
  @Output() columnPinned = new EventEmitter<{
    columnId: string;
    pinned: "left" | "right" | null;
  }>();
  @Output() saveAll = new EventEmitter<{ rows: T[]; selectedRows: T[]; visibleRows: T[]; reason: "toolbar" | "api" }>();
  @Output() dataChange = new EventEmitter<{ rows: T[]; previousRows: T[]; reason: string }>();
  @Output() rowAdd = new EventEmitter<{ row: T; rowIndex: number; rows: T[] }>();
  @Output() rowDelete = new EventEmitter<{ row: T; rowIndex: number; rows: T[]; remainingRows: T[] }>();
  @Output() rowsDelete = new EventEmitter<{ rows: T[]; rowIndexes: number[]; remainingRows: T[] }>();
  @Output() advancedFilterModelChange = new EventEmitter<AdvancedFilterModel | null>();
  @Output() pivotModelChange = new EventEmitter<{
    groupBy?: keyof T & string;
    pivotBy?: keyof T & string;
    pivotValueColumns: Array<keyof T & string>;
    pivotAggregation: PivotAggregation;
  }>();
  @Output() serverSideOperation = new EventEmitter<ServerSideOperationState<T>>();

  @ViewChild("host", { static: true }) host?: ElementRef<HTMLElement>;
  private selected = new Set<string | number>();
  private pageIndex = 0;
  private sortState: SortState = null;
  private hiddenColumnIds = new Set<string>();
  private activeCell: CellPoint | null = null;
  private rangeAnchor: CellPoint | null = null;
  private rangeEnd: CellPoint | null = null;
  private contextMenu: { x: number; y: number; rowIndex: number; columnId: string } | null = null;
  private expandedDetailIds = new Set<string | number>();
  private collapsedGroups = new Set<string>();
  private collapsedTreeKeys = new Set<string>();
  private findText = "";
  private toolsOpen = false;
  private draggedColumnId: string | null = null;
  private draggedRowIndex: number | null = null;
  private columnWidths = new Map<string, number>();
  private aiPrompt = "";
  private aiPlan: GridNexaCommandPlan | null = null;
  private aiBusy = false;
  private aiError: string | null = null;
  private undoStack: Array<CellEdit<T>> = [];
  private redoStack: Array<CellEdit<T>> = [];
  private hydratedStorageKey: string | null = null;
  private persistTimer: number | undefined;

  ngAfterViewInit() {
    this.attachApi();
    this.render();
  }

  ngOnChanges() {
    this.hiddenColumnIds = new Set(this.columns.filter((column) => column.hidden).map((column) => column.id));
    this.columns.forEach((column) => {
      if (column.width && !this.columnWidths.has(column.id)) this.columnWidths.set(column.id, column.width);
    });
    this.applyPersistedState();
    this.applyTransaction();
    this.attachApi();
    this.render();
  }

  private rowId(row: T, index: number) {
    return this.getRowId?.(row, index) ?? index;
  }

  getRows() {
    return this.rows;
  }

  setRows(rows: T[]) {
    const previousRows = this.rows;
    this.rows = rows;
    this.emitDataChange(rows, previousRows, "transaction");
    this.render();
  }

  addRow(row = this.createRowValue()) {
    const previousRows = this.rows;
    this.rows = [...this.rows, row];
    this.emitDataChange(this.rows, previousRows, "rowAdd");
    this.rowAdd.emit({ row, rowIndex: this.rows.length - 1, rows: this.rows });
    this.render();
  }

  deleteRow(rowIndex: number) {
    const row = this.rows[rowIndex];
    if (!row) return;
    const previousRows = this.rows;
    this.rows = this.rows.filter((_, index) => index !== rowIndex);
    this.selected.delete(this.rowId(row, rowIndex));
    this.emitDataChange(this.rows, previousRows, "rowDelete");
    this.rowDelete.emit({ row, rowIndex, rows: [row], remainingRows: this.rows });
    this.render();
  }

  deleteSelectedRows() {
    const previousRows = this.rows;
    const rowIndexes: number[] = [];
    const rowsToDelete = this.rows.filter((row, index) => {
      const selected = this.selected.has(this.rowId(row, index));
      if (selected) rowIndexes.push(index);
      return selected;
    });
    if (!rowsToDelete.length) return;
    this.rows = this.rows.filter((row, index) => !this.selected.has(this.rowId(row, index)));
    this.selected.clear();
    this.emitDataChange(this.rows, previousRows, "rowsDelete");
    this.rowsDelete.emit({ rows: rowsToDelete, rowIndexes, remainingRows: this.rows });
    this.render();
  }

  saveAllRows(reason: "toolbar" | "api" = "api") {
    this.saveAll.emit({
      rows: this.rows,
      selectedRows: this.rows.filter((row, index) => this.selected.has(this.rowId(row, index))),
      visibleRows: this.visibleRows(),
      reason,
    });
  }

  private createRowValue() {
    return this.createRow ? this.createRow() : Object.fromEntries(this.columns.map((column) => [column.field, ""])) as T;
  }

  private emitDataChange(rows: T[], previousRows: T[], reason: string) {
    this.dataChange.emit({ rows, previousRows, reason });
  }

  private attachApi() {
    if (!this.apiRef) return;
    this.apiRef.current = {
      getRows: () => this.getRows(),
      setRows: (rows: T[]) => this.setRows(rows),
      addRow: (row?: T) => this.addRow(row),
      deleteRow: (rowIndex: number) => this.deleteRow(rowIndex),
      deleteSelectedRows: () => this.deleteSelectedRows(),
      saveAll: () => this.saveAllRows("api"),
    };
  }

  private presetDefaults() {
    return resolvePresetDefaults<T>(this.preset);
  }

  private effectiveToolbar() {
    return this.toolbar ?? this.presetDefaults().toolbar;
  }

  private effectiveFooter() {
    return this.footer ?? this.presetDefaults().footer;
  }

  private effectiveFillWidth() {
    return this.fillWidth ?? this.presetDefaults().fillWidth;
  }

  private effectivePageSize() {
    return this.pageSize ?? this.presetDefaults().pageSize;
  }

  private effectiveRowNumbers() {
    return this.rowNumbers || Boolean(this.presetDefaults().rowNumbers);
  }

  private effectiveCheckboxSelection() {
    return this.checkboxSelection || Boolean(this.presetDefaults().checkboxSelection);
  }

  private effectiveRangeSelection() {
    return this.enableRangeSelection || Boolean(this.presetDefaults().enableRangeSelection);
  }

  private effectiveFillHandle() {
    return this.enableFillHandle || Boolean(this.presetDefaults().enableFillHandle);
  }

  private effectiveUndoRedo() {
    return this.enableUndoRedo || Boolean(this.presetDefaults().enableUndoRedo);
  }

  private applyPersistedState() {
    const storage = resolveStateStorageOptions(this.stateStorage);
    if (!storage || this.hydratedStorageKey === storage.key) return;
    const persisted = readPersistedGridState(this.stateStorage);
    this.hydratedStorageKey = storage.key;
    if (!persisted) return;
    if (storage.persist.includes("columns")) {
      if (persisted.hiddenColumnIds) this.hiddenColumnIds = new Set(persisted.hiddenColumnIds);
      Object.entries(persisted.columnWidths ?? {}).forEach(([columnId, width]) => this.columnWidths.set(columnId, width));
      this.columns = this.columns.map((column) => ({
        ...column,
        width: persisted.columnWidths?.[column.id] ?? column.width,
        pinned: persisted.pinnedColumnIds?.[column.id] ?? column.pinned,
      }));
    }
    if (storage.persist.includes("filters") && persisted.filterModel) this.columnFilters = persisted.filterModel;
    if (storage.persist.includes("sort")) this.sortState = persisted.sortModel ?? this.sortState;
    if (storage.persist.includes("pagination") && typeof persisted.pageIndex === "number") this.pageIndex = persisted.pageIndex;
  }

  private schedulePersistState() {
    const storage = resolveStateStorageOptions(this.stateStorage);
    if (!storage) return;
    if (this.persistTimer != null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      const state: PersistedGridState = {};
      if (storage.persist.includes("columns")) {
        state.columnWidths = Object.fromEntries(this.columnWidths.entries());
        state.hiddenColumnIds = Array.from(this.hiddenColumnIds);
        state.pinnedColumnIds = Object.fromEntries(this.columns.map((column) => [column.id, column.pinned]));
      }
      if (storage.persist.includes("filters")) state.filterModel = this.columnFilters;
      if (storage.persist.includes("sort")) state.sortModel = this.sortState;
      if (storage.persist.includes("pagination")) state.pageIndex = this.pageIndex;
      writePersistedGridState(this.stateStorage, state);
    }, 120);
  }

  private applyTransaction() {
    if (!this.transaction) return;
    const removeIds = new Set((this.transaction.remove ?? []).map((row, index) => this.rowId(row, index)));
    const updates = new Map((this.transaction.update ?? []).map((row, index) => [this.rowId(row, index), row]));
    this.rows = [
      ...this.rows.filter((row, index) => !removeIds.has(this.rowId(row, index))).map((row, index) => updates.get(this.rowId(row, index)) ?? row),
      ...(this.transaction.add ?? []),
    ];
    this.transaction = undefined;
  }

  private visibleRows() {
    const query = this.quickFilterText.trim().toLowerCase();
    const rows = this.rows.filter((row) => {
      if (this.externalFilter && !this.externalFilter(row)) return false;
      if (this.advancedFilter && !this.advancedFilter(row)) return false;
      if (!matchesAdvanced(row, this.columns, this.advancedFilterModel)) return false;
      if (query && !this.columns.some((column) => String(value(row, column, this.columns) ?? "").toLowerCase().includes(query))) return false;
      return Object.entries(this.columnFilters ?? {}).every(([columnId, filter]) => {
        const column = this.columns.find((entry) => entry.id === columnId);
        return column ? matches(row, column, filter, this.columns) : true;
      });
    });
    if (!this.sortState) return rows;
    const column = this.columns.find((entry) => entry.id === this.sortState?.columnId);
    if (!column) return rows;
    return [...rows].sort((left, right) => {
      const comparison = String(value(left, column, this.columns) ?? "").localeCompare(String(value(right, column, this.columns) ?? ""), undefined, { numeric: true });
      return this.sortState?.direction === "asc" ? comparison : -comparison;
    });
  }

  private exportRows(columns: Column<T>[], rows: T[], excel = false) {
    const content = excel
      ? `<table><tr>${columns.map((column) => `<th>${column.headerName}</th>`).join("")}</tr>${rows.map((row) => `<tr>${columns.map((column) => `<td>${format(row, column, this.columns)}</td>`).join("")}</tr>`).join("")}</table>`
      : [columns.map((column) => JSON.stringify(column.headerName)).join(","), ...rows.map((row) => columns.map((column) => JSON.stringify(format(row, column, this.columns))).join(","))].join("\n");
    const blob = new Blob([content], { type: excel ? "application/vnd.ms-excel" : "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = excel ? "gridnexa-export.xls" : "gridnexa-export.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private setCellValue(row: T, rowIndex: number, column: Column<T>, nextValue: unknown, trackHistory = true) {
    const oldValue = rawValue(row, column);
    const newValue = typeof oldValue === "number" ? Number(nextValue) : nextValue;

    if (trackHistory && this.effectiveUndoRedo()) {
      this.undoStack.push({ row, rowIndex, column, oldValue, newValue });
      this.redoStack = [];
    }

    (row as Record<string, unknown>)[column.field] = newValue;
    this.cellValueChange.emit({ row, rowIndex, column, oldValue, newValue });
    this.cellEditStop.emit({ row, rowIndex, column, oldValue, newValue });
  }

  private undo() {
    const edit = this.undoStack.pop();
    if (!edit) return;
    this.setCellValue(edit.row, edit.rowIndex, edit.column, edit.oldValue, false);
    this.redoStack.push(edit);
    this.render();
  }

  private redo() {
    const edit = this.redoStack.pop();
    if (!edit) return;
    this.setCellValue(edit.row, edit.rowIndex, edit.column, edit.newValue, false);
    this.undoStack.push(edit);
    this.render();
  }

  private fillDown() {
    if (!this.activeCell || !this.effectiveFillHandle()) return;
    const column = this.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (this.rangeAnchor && this.rangeEnd && column) {
      const minRow = Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
      const maxRow = Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
      const sourceRow = this.rows[minRow];
      if (!sourceRow || column.editable === false) return;
      const sourceValue = rawValue(sourceRow, column);
      for (let rowIndex = minRow + 1; rowIndex <= maxRow; rowIndex += 1) {
        const row = this.rows[rowIndex];
        if (row) this.setCellValue(row, rowIndex, column, sourceValue);
      }
      this.render();
      return;
    }
    const sourceRow = this.rows[this.activeCell.rowIndex];
    const targetRow = this.rows[this.activeCell.rowIndex + 1];
    if (!sourceRow || !targetRow || !column || column.editable === false) return;
    this.setCellValue(targetRow, this.activeCell.rowIndex + 1, column, rawValue(sourceRow, column));
    this.render();
  }

  private async copyActiveCell() {
    if (!this.activeCell || typeof navigator === "undefined") return;
    if (this.rangeAnchor && this.rangeEnd) {
      const columns = this.columns.filter((column) => !this.hiddenColumnIds.has(column.id) && !column.hidden);
      const anchorColumn = columns.findIndex((entry) => entry.id === this.rangeAnchor?.columnId);
      const endColumn = columns.findIndex((entry) => entry.id === this.rangeEnd?.columnId);
      const text = this.rows
        .slice(Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex), Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex) + 1)
        .map((row) => columns.slice(Math.min(anchorColumn, endColumn), Math.max(anchorColumn, endColumn) + 1).map((column) => format(row, column, this.columns)).join("\t"))
        .join("\n");
      await navigator.clipboard?.writeText(text);
      return;
    }
    const row = this.rows[this.activeCell.rowIndex];
    const column = this.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (!row || !column) return;
    await navigator.clipboard?.writeText(format(row, column, this.columns));
  }

  private async pasteActiveCell() {
    if (!this.activeCell || typeof navigator === "undefined") return;
    const text = await navigator.clipboard?.readText();
    const columns = this.columns.filter((column) => !this.hiddenColumnIds.has(column.id) && !column.hidden);
    const startColumn = columns.findIndex((entry) => entry.id === this.activeCell?.columnId);
    text.split(/\r?\n/).forEach((line, rowOffset) => {
      line.split("\t").forEach((value, columnOffset) => {
        const rowIndex = this.activeCell!.rowIndex + rowOffset;
        const row = this.rows[rowIndex];
        const column = columns[startColumn + columnOffset];
        if (row && column && column.editable !== false) this.setCellValue(row, rowIndex, column, value);
      });
    });
    this.render();
  }

  private moveRow(rowIndex: number, direction: -1 | 1) {
    const nextIndex = rowIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.rows.length) return;
    const rows = [...this.rows];
    const [row] = rows.splice(rowIndex, 1);
    rows.splice(nextIndex, 0, row);
    this.rows = rows;
    this.rowOrderChange.emit({ rows, movedRow: row, sourceIndex: rowIndex, targetIndex: nextIndex });
    this.render();
  }

  private reorderRow(sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || sourceIndex >= this.rows.length || targetIndex >= this.rows.length) return;
    const rows = [...this.rows];
    const [row] = rows.splice(sourceIndex, 1);
    rows.splice(targetIndex, 0, row);
    this.rows = rows;
    this.rowOrderChange.emit({ rows, movedRow: row, sourceIndex, targetIndex });
    this.render();
  }

  private moveColumn(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const columns = [...this.columns];
    const sourceIndex = columns.findIndex((column) => column.id === sourceId);
    const targetIndex = columns.findIndex((column) => column.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [column] = columns.splice(sourceIndex, 1);
    columns.splice(targetIndex, 0, column);
    this.columns = columns;
    this.columnMoved.emit({
      columnId: column.id,
      sourceIndex,
      targetIndex,
      columnIds: columns.map((entry) => entry.id),
    });
    this.render();
  }

  private makeDisplayRows(rows: T[]): Array<DisplayRow<T>> {
    if (this.groupBy) {
      const buckets = new Map<string, T[]>();
      rows.forEach((row) => {
        const key = String(row[this.groupBy as keyof T] ?? "Ungrouped");
        buckets.set(key, [...(buckets.get(key) ?? []), row]);
      });
      return Array.from(buckets.entries()).flatMap(([key, bucket]) => [
        { kind: "group" as const, key, label: key, rows: bucket, summaries: buildGroupSummary(bucket, this.columns, this.groupBy) },
        ...(this.collapsedGroups.has(key)
          ? []
          : bucket.map((row) => ({ kind: "data" as const, row, rowIndex: this.rows.indexOf(row) }))),
      ]);
    }
    if (this.getTreeDataPath) {
      return rows
        .map((row) => {
          const path = this.getTreeDataPath?.(row).filter(Boolean) ?? [];
          return { row, path, key: path.join("/") };
        })
        .sort((left, right) => left.key.localeCompare(right.key))
        .filter((entry) => entry.path.slice(0, -1).every((_, index) => !this.collapsedTreeKeys.has(entry.path.slice(0, index + 1).join("/"))))
        .map((entry, _index, entries) => ({
          kind: "data" as const,
          row: entry.row,
          rowIndex: this.rows.indexOf(entry.row),
          depth: Math.max(0, entry.path.length - 1),
          treeKey: entry.key,
          hasChildren: entries.some((other) => other.key.startsWith(`${entry.key}/`)),
        }));
    }
    return rows.map((row) => ({ kind: "data", row, rowIndex: this.rows.indexOf(row) }));
  }

  private isCellInRange(rowIndex: number, columnId: string, columns: Column<T>[]) {
    if (!this.rangeAnchor || !this.rangeEnd || !this.effectiveRangeSelection()) return false;
    const columnIndex = columns.findIndex((column) => column.id === columnId);
    const anchorIndex = columns.findIndex((column) => column.id === this.rangeAnchor?.columnId);
    const endIndex = columns.findIndex((column) => column.id === this.rangeEnd?.columnId);
    return rowIndex >= Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex) &&
      rowIndex <= Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex) &&
      columnIndex >= Math.min(anchorIndex, endIndex) &&
      columnIndex <= Math.max(anchorIndex, endIndex);
  }

  private startColumnResize(event: MouseEvent, column: Column<T>) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = this.columnWidth(column);
    const move = (moveEvent: MouseEvent) => {
      const width = Math.max(72, startWidth + moveEvent.clientX - startX);
      this.columnWidths.set(column.id, width);
      this.columnResized.emit({ columnId: column.id, width });
      this.render();
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  private pinnedStyle(column: Column<T>, columns: Column<T>[]) {
    if (!column.pinned) return "";
    const index = columns.findIndex((entry) => entry.id === column.id);
    const width = (entry: Column<T>) => this.columnWidth(entry);
    const offset =
      column.pinned === "left"
        ? columns.slice(0, index).filter((entry) => entry.pinned === "left").reduce((sum, entry) => sum + width(entry), 0)
        : columns.slice(index + 1).filter((entry) => entry.pinned === "right").reduce((sum, entry) => sum + width(entry), 0);
    return `position:sticky;${column.pinned}:${offset}px;z-index:2;background:white;box-shadow:${column.pinned === "left" ? "inset -1px 0 #dbe3ef" : "inset 1px 0 #dbe3ef"};`;
  }

  private columnWidth(column: Column<T>) {
    const explicit = this.columnWidths.get(column.id) ?? column.width;
    if (explicit != null) return explicit;
    const contentWidth = this.rows
      .slice(0, 100)
      .reduce((max, row) => Math.max(max, estimateWidth(format(row, column, this.columns))), estimateWidth(column.headerName) + 72);

    return Math.min(column.maxWidth ?? 1000, Math.max(column.minWidth ?? 72, contentWidth));
  }

  private updateAdvancedFilter(columnId: string, operator: ColumnFilterModel["operator"], filterValue: string) {
    const model: AdvancedFilterModel = {
      kind: "group",
      joinOperator: "and",
      conditions: [{ kind: "rule", columnId, operator, value: filterValue }],
    };
    this.advancedFilterModel = model;
    this.advancedFilterModelChange.emit(model);
    this.filterChanged.emit(this.columnFilters ?? {});
    this.render();
  }

  private updatePivot(next: Partial<Pick<GridNexaAngularOptions<T>, "groupBy" | "pivotBy" | "pivotValueColumns">> & { pivotAggregation?: PivotAggregation }) {
    if ("groupBy" in next) this.groupBy = next.groupBy;
    if ("pivotBy" in next) this.pivotBy = next.pivotBy;
    if ("pivotValueColumns" in next) this.pivotValueColumns = next.pivotValueColumns;
    if ("pivotAggregation" in next && next.pivotAggregation) this.pivotAggregation = next.pivotAggregation;
    this.pivotModelChange.emit({
      groupBy: this.groupBy,
      pivotBy: this.pivotBy,
      pivotValueColumns: this.pivotValueColumns ?? [],
      pivotAggregation: this.pivotAggregation,
    });
    this.pageIndex = 0;
    this.render();
  }

  private resolveColumn(idOrField?: string | null) {
    return idOrField ? this.columns.find((column) => column.id === idOrField || column.field === idOrField) : undefined;
  }

  private createAiRequest(prompt: string): GridNexaAiRequest {
    return {
      prompt,
      state: {
        columns: this.columns.map((column) => ({
          id: column.id,
          field: String(column.field),
          headerName: column.headerName,
          type: typeof column.filter === "string" ? column.filter : column.filter?.type,
          hidden: this.hiddenColumnIds.has(column.id) || column.hidden,
          pinned: column.pinned,
        })),
        rowCount: this.rows.length,
        sampleRows: this.rows.slice(0, this.ai?.sampleRowCount ?? 8).map((row) =>
          Object.fromEntries(this.columns.map((column) => [String(column.field), value(row, column, this.columns)])),
        ),
        quickFilterText: this.quickFilterText,
        groupBy: this.groupBy,
        pivotBy: this.pivotBy,
        pivotValueColumns: this.pivotValueColumns as string[] | undefined,
        pivotAggregation: this.pivotAggregation,
        activeColumnFilters: this.columnFilters,
        advancedFilterModel: this.advancedFilterModel,
      },
    };
  }

  private applyAiAction(action: GridNexaCommandAction) {
    if (action.type === "quickFilter") {
      this.quickFilterText = action.value;
      this.pageIndex = 0;
    } else if (action.type === "setColumnFilter") {
      const column = this.resolveColumn(action.columnId);
      if (column) {
        const filters = { ...(this.columnFilters ?? {}) };
        action.filter ? (filters[column.id] = action.filter) : delete filters[column.id];
        this.columnFilters = filters;
      }
    } else if (action.type === "setAdvancedFilter") {
      this.advancedFilterModel = action.model;
      this.advancedFilterModelChange.emit(action.model);
    } else if (action.type === "sort") {
      const column = this.resolveColumn(action.columnId);
      this.sortState = column && action.direction ? { columnId: column.id, direction: action.direction } : null;
    } else if (action.type === "group") {
      const column = this.resolveColumn(action.columnId);
      this.updatePivot({ groupBy: column ? column.field as keyof T & string : undefined });
      return;
    } else if (action.type === "pivot") {
      const groupColumn = this.resolveColumn(action.groupBy);
      const pivotColumn = this.resolveColumn(action.pivotBy);
      const valueColumns = (action.valueColumns ?? [])
        .map((columnId) => this.resolveColumn(columnId)?.field as keyof T & string | undefined)
        .filter((field): field is keyof T & string => Boolean(field));
      this.updatePivot({
        groupBy: action.groupBy === null ? undefined : groupColumn?.field as keyof T & string | undefined,
        pivotBy: action.pivotBy === null ? undefined : pivotColumn?.field as keyof T & string | undefined,
        pivotValueColumns: valueColumns.length ? valueColumns : this.pivotValueColumns,
        pivotAggregation: action.aggregation ?? this.pivotAggregation,
      });
      return;
    } else if (action.type === "pinColumn") {
      const column = this.resolveColumn(action.columnId);
      if (column) column.pinned = action.pinned ?? undefined;
    } else if (action.type === "hideColumn") {
      const column = this.resolveColumn(action.columnId);
      if (column) action.hidden ? this.hiddenColumnIds.add(column.id) : this.hiddenColumnIds.delete(column.id);
    } else if (action.type === "export") {
      const visible = this.columns.filter((column) => !this.hiddenColumnIds.has(column.id) && !column.hidden);
      action.format === "excel" ? this.exportRows(visible, this.visibleRows(), true) : this.exportRows(visible, this.visibleRows());
    }
    this.render();
  }

  private applyAiPlan(plan: GridNexaCommandPlan) {
    plan.actions.forEach((action) => this.applyAiAction(action));
    this.ai?.onApply?.(plan);
    this.aiPlan = null;
  }

  private async requestAiPlan() {
    const prompt = this.aiPrompt.trim();
    if (!prompt || this.aiBusy) return;
    this.aiBusy = true;
    this.aiError = null;
    this.render();
    try {
      const request = this.createAiRequest(prompt);
      const result = this.ai?.provider
        ? await this.ai.provider(request)
        : this.ai?.endpoint
          ? await (await (this.ai.fetcher ?? fetch)(this.ai.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request),
            })).json()
          : null;
      const plan = result && "plan" in result ? result.plan : result as GridNexaCommandPlan;
      if (!plan?.actions?.length) throw new Error("AI did not return any grid actions.");
      this.aiPlan = plan;
      this.ai?.onPlan?.(plan);
      if (this.ai?.autoApply) this.applyAiPlan(plan);
    } catch (error) {
      this.aiError = error instanceof Error ? error.message : "AI request failed";
      this.ai?.onError?.(error);
    } finally {
      this.aiBusy = false;
      this.render();
    }
  }

  private render() {
    if (!this.host) return;
    const sourceRows = this.visibleRows();
    const pivot = buildPivot(sourceRows, this.columns, this.groupBy, this.pivotBy, this.pivotValueColumns, this.pivotAggregation);
    const columns = pivot.columns
      .filter((column) => !this.hiddenColumnIds.has(column.id) && !column.hidden)
      .sort((left, right) => (left.pinned === "left" ? 0 : left.pinned === "right" ? 2 : 1) - (right.pinned === "left" ? 0 : right.pinned === "right" ? 2 : 1));
    const pageSize = this.effectivePageSize();
    const pageRows = pageSize ? pivot.rows.slice(this.pageIndex * pageSize, this.pageIndex * pageSize + pageSize) : pivot.rows;
    const displayRows = pivot.active ? pageRows.map((row) => ({ kind: "data" as const, row, rowIndex: pivot.rows.indexOf(row) })) : this.makeDisplayRows(pageRows);
    const root = document.createElement("div");
    root.className = ["gridnexa-angular-grid", this.className]
      .filter(Boolean)
      .join(" ");
    root.dataset.gnxTheme = this.theme ?? "dark";
    root.dataset.gnxDensity = this.density ?? "standard";
    root.style.position = "relative";
    if (this.height != null) root.style.height = typeof this.height === "number" ? `${this.height}px` : this.height;
    const toolbar = this.renderToolbar(columns, pivot.rows);
    if (toolbar) root.appendChild(toolbar);
    root.appendChild(this.renderTable(columns, displayRows));
    const overlay = this.renderOverlay(displayRows.length);
    if (overlay) root.appendChild(overlay);
    root.appendChild(this.renderStatus(pivot.rows.length));
    if (this.contextMenu) root.appendChild(this.renderContextMenu());
    this.host.nativeElement.replaceChildren(root);
    this.serverSideOperation.emit({
      sortModel: this.sortState ? [this.sortState] : [],
      filterModel: this.columnFilters,
      advancedFilterModel: this.advancedFilterModel,
      selectedRowIds: Array.from(this.selected),
      pageIndex: this.pageIndex,
      pageSize,
      groupBy: this.groupBy,
      pivotBy: this.pivotBy,
      pivotValueColumns: this.pivotValueColumns,
      pivotAggregation: this.pivotAggregation,
      treeData: Boolean(this.getTreeDataPath),
      masterDetail: Boolean(this.masterDetailRenderer),
    });
    this.schedulePersistState();
  }

  private renderOverlay(displayRowCount: number) {
    const hasError = this.error != null && this.error !== false;
    const isEmpty = !this.loading && !hasError && displayRowCount === 0;
    if (!this.loading && !hasError && !isEmpty) return null;
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(248,251,255,.78);backdrop-filter:blur(3px);pointer-events:none";
    const card = document.createElement("div");
    card.style.cssText = `max-width:min(420px,calc(100% - 32px));padding:18px 20px;border:1px solid ${hasError ? "rgba(220,38,38,.24)" : "rgba(30,64,175,.16)"};border-radius:14px;background:#fff;color:${hasError ? "#991b1b" : "#172033"};box-shadow:0 22px 60px rgba(15,23,42,.16);font-weight:800;text-align:center`;
    card.textContent = this.loading
      ? "Loading data..."
      : hasError
        ? this.error instanceof Error
          ? this.error.message
          : typeof this.error === "string"
            ? this.error
            : "Something went wrong while loading the grid."
        : typeof this.emptyState === "string"
          ? this.emptyState
          : this.emptyState == null
            ? "No rows to display"
            : String(this.emptyState);
    overlay.appendChild(card);
    return overlay;
  }

  private renderToolbar(columns: Column<T>[], rows: T[]) {
    const toolbarConfig = this.effectiveToolbar();
    const defaults = typeof toolbarConfig === "object"
      ? { summary: false, pagination: false, quickFilter: false, find: false, undoRedo: false, fillHandle: false, fill: false, filters: false, advancedFilter: false, columns: false, columnSelector: false, exportCsv: false, exportExcel: false, prevNextPage: false, saveAll: false, addRow: false, deleteRow: false, deleteSelectedRows: false, ai: false }
      : { summary: true, pagination: true, quickFilter: true, find: true, undoRedo: true, fillHandle: true, fill: true, filters: true, advancedFilter: true, columns: true, columnSelector: true, exportCsv: true, exportExcel: true, prevNextPage: true, saveAll: this.saveAll.observed, addRow: false, deleteRow: false, deleteSelectedRows: false, ai: true };
    const raw = { ...defaults, ...(typeof toolbarConfig === "object" ? toolbarConfig : {}) };
    const toolbarOptions = { ...raw, pagination: raw.pagination || raw.prevNextPage, fillHandle: raw.fillHandle || raw.fill, columns: raw.columns || raw.columnSelector };
    if (toolbarConfig === false || !Object.values(toolbarOptions).some(Boolean)) return null;
    const toolbar = document.createElement("div");
    toolbar.style.cssText = "display:flex;gap:8px;justify-content:space-between;align-items:center;padding:10px;background:#f8fbff;border:1px solid #dbe3ef";
    if (toolbarOptions.summary) toolbar.append(`${rows.length} rows`);
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
    const aiEnabled = this.ai?.enabled ?? Boolean(this.ai?.provider || this.ai?.endpoint);
    if (toolbarOptions.ai && aiEnabled) toolbar.appendChild(this.renderAiCommand());
    const find = document.createElement("input");
    find.type = "search";
    find.placeholder = "Find cell";
    find.value = this.findText;
    find.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
    find.addEventListener("input", () => {
      this.findText = find.value;
      this.render();
    });
    const quickFilter = document.createElement("input");
    quickFilter.type = "search";
    quickFilter.placeholder = "Quick filter";
    quickFilter.value = this.quickFilterText;
    quickFilter.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
    quickFilter.addEventListener("input", () => {
      this.quickFilterText = quickFilter.value;
      this.pageIndex = 0;
      this.render();
    });
    const pageSize = this.effectivePageSize();
    const pageCount = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
    if (false && toolbarOptions.pagination && pageSize) {
      const prev = this.button("Prev", () => {
        this.pageIndex = Math.max(0, this.pageIndex - 1);
        this.render();
      });
      prev.disabled = this.pageIndex <= 0;
      const next = this.button("Next", () => {
        this.pageIndex = Math.min(pageCount - 1, this.pageIndex + 1);
        this.render();
      });
      next.disabled = this.pageIndex >= pageCount - 1;
      actions.append(prev, ` Page ${this.pageIndex + 1} `, next);
    }
    if (toolbarOptions.quickFilter) actions.appendChild(quickFilter);
    if (toolbarOptions.find) actions.appendChild(find);
    if (toolbarOptions.undoRedo && this.effectiveUndoRedo()) {
      const undo = this.button("Undo", () => this.undo());
      undo.disabled = !this.undoStack.length;
      const redo = this.button("Redo", () => this.redo());
      redo.disabled = !this.redoStack.length;
      actions.append(undo, redo);
    }
    if (toolbarOptions.fillHandle && this.effectiveFillHandle()) actions.appendChild(this.button("Fill", () => this.fillDown()));
    if (toolbarOptions.addRow) actions.appendChild(this.button("Add row", () => this.addRow()));
    if (toolbarOptions.deleteRow) actions.appendChild(this.button("Delete row", () => this.deleteRow(this.activeCell?.rowIndex ?? 0)));
    if (toolbarOptions.deleteSelectedRows) actions.appendChild(this.button("Delete selected", () => this.deleteSelectedRows()));
    if (toolbarOptions.columns || toolbarOptions.filters || toolbarOptions.advancedFilter) {
      const toolsButton = this.button(this.toolsOpen ? "Hide tools" : "Tools", () => undefined);
      toolsButton.addEventListener("click", () => {
        this.toolsOpen = !this.toolsOpen;
        this.render();
      });
      actions.appendChild(toolsButton);
      if (this.toolsOpen) actions.appendChild(this.renderToolsPanel());
    }
    if (toolbarOptions.saveAll) actions.appendChild(this.button("Save all", () => this.saveAllRows("toolbar")));
    if (toolbarOptions.exportCsv) actions.appendChild(this.button("Export CSV", () => this.exportRows(columns, rows)));
    if (toolbarOptions.exportExcel) actions.appendChild(this.button("Export Excel", () => this.exportRows(columns, rows, true)));
    toolbar.appendChild(actions);
    return toolbar;
  }

  private renderAiCommand() {
    const shell = document.createElement("div");
    shell.style.cssText = "display:flex;gap:8px;align-items:end;flex-wrap:wrap";
    const input = document.createElement("input");
    input.placeholder = this.ai?.placeholder ?? "Ask AI to filter, sort, group, pivot, pin, or export";
    input.value = this.aiPrompt;
    input.style.cssText = "min-height:32px;min-width:280px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
    input.addEventListener("input", () => {
      this.aiPrompt = input.value;
    });
    const ask = this.button(this.aiBusy ? "Thinking" : "Ask AI", () => void this.requestAiPlan());
    ask.disabled = this.aiBusy;
    shell.append(input, ask);
    if (this.aiError) shell.append(` ${this.aiError}`);
    if (this.aiPlan) {
      shell.append(
        ` ${this.aiPlan.title} `,
        this.button("Dismiss", () => {
          this.aiPlan = null;
          this.render();
        }),
        this.button(`Apply ${this.aiPlan.actions.length}`, () => this.applyAiPlan(this.aiPlan!)),
      );
    }
    return shell;
  }

  private renderTable(columns: Column<T>[], rows: Array<DisplayRow<T>>) {
    const fillWidth = this.effectiveFillWidth();
    const fillWidthEnabled =
      fillWidth === true ||
      (typeof fillWidth === "object" && fillWidth?.enabled !== false);
    const table = document.createElement("table");
    table.style.cssText = `width:${fillWidthEnabled ? "100%" : "max-content"};min-width:max-content;border-collapse:collapse`;
    const thead = document.createElement("thead");
    const checkboxSelection = this.effectiveCheckboxSelection();
    const rowNumbers = this.effectiveRowNumbers();
    const leading = Number(checkboxSelection) + Number(rowNumbers);
    if (this.mergedHeaders?.length) thead.appendChild(this.renderMergedHeaders(columns, leading));
    const header = document.createElement("tr");
    if (checkboxSelection) header.appendChild(cell("", "th"));
    if (rowNumbers) header.appendChild(cell("#", "th"));
    columns.forEach((column, columnIndex) => {
      const tools = resolveToolOptions(this.columnTools, column);
      const th = cell(`${column.headerName}${this.sortState?.columnId === column.id ? (this.sortState.direction === "asc" ? " ↑" : " ↓") : ""}`, "th");
      th.style.cssText = `padding:10px;border:1px solid #dbe3ef;background:#f8fbff;text-align:left;width:${this.columnWidth(column)}px;${this.pinnedStyle(column, columns)}`;
      th.className = classNameList(
        this.classNames?.headerCell,
        typeof column.headerClassName === "function"
          ? column.headerClassName({ column })
          : column.headerClassName,
        this.getHeaderClassName?.({ column, columnIndex }),
      );
      th.draggable = Boolean(tools.menu);
      th.addEventListener("dragstart", () => {
        this.draggedColumnId = column.id;
      });
      th.addEventListener("dragover", (event) => event.preventDefault());
      th.addEventListener("drop", (event) => {
        event.preventDefault();
        if (this.draggedColumnId) this.moveColumn(this.draggedColumnId, column.id);
        this.draggedColumnId = null;
      });
      th.addEventListener("click", () => {
        if (!tools.sort || column.sortable === false) return;
        this.sortState = this.sortState?.columnId !== column.id ? { columnId: column.id, direction: "asc" } : this.sortState.direction === "asc" ? { columnId: column.id, direction: "desc" } : null;
        this.sortChanged.emit(this.sortState ? [this.sortState] : []);
        this.render();
      });
      if (tools.resize && column.resizable !== false) {
        const resizer = document.createElement("span");
        resizer.style.cssText = "float:right;width:7px;height:24px;cursor:col-resize;border-right:2px solid #bfdbfe";
        resizer.addEventListener("mousedown", (event) => this.startColumnResize(event, column));
        th.appendChild(resizer);
      }
      header.appendChild(th);
    });
    thead.appendChild(header);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((entry) => {
      if (entry.kind === "group") this.appendGroupRow(tbody, entry, columns.length + leading);
      if (entry.kind === "data") {
        this.appendRow(tbody, entry.row, entry.rowIndex, columns, leading, entry);
        const rowId = this.rowId(entry.row, entry.rowIndex);
        if (this.masterDetailRenderer && this.expandedDetailIds.has(rowId)) this.appendDetailRow(tbody, entry.row, columns.length + leading);
      }
    });
    table.appendChild(tbody);
    return table;
  }

  private renderMergedHeaders(columns: Column<T>[], leading: number) {
    const row = document.createElement("tr");
    if (leading) {
      const spacer = cell("", "th");
      spacer.colSpan = leading;
      row.appendChild(spacer);
    }
    (this.mergedHeaders ?? []).forEach((header) => {
      const count = header.columnIds.filter((columnId) => columns.some((column) => column.id === columnId)).length;
      if (!count) return;
      const th = cell(header.headerName, "th");
      th.colSpan = count;
      th.style.cssText = "padding:8px;border:1px solid #bfdbfe;background:#e8f1ff;text-align:center";
      row.appendChild(th);
    });
    return row;
  }

  private appendGroupRow(tbody: HTMLTableSectionElement, entry: Extract<DisplayRow<T>, { kind: "group" }>, colSpan: number) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = colSpan;
    td.style.cssText = "padding:10px;border:1px solid #dbe3ef;background:#eef4ff;color:#153e90;font-weight:800;text-transform:uppercase";
    const toggle = this.button(this.collapsedGroups.has(entry.key) ? "+" : "-", () => {
      this.collapsedGroups.has(entry.key) ? this.collapsedGroups.delete(entry.key) : this.collapsedGroups.add(entry.key);
      this.render();
    });
    td.append(toggle, `${entry.label}  ${entry.rows.length} rows${entry.summaries ? `  ${entry.summaries}` : ""}`);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  private appendDetailRow(tbody: HTMLTableSectionElement, row: T, colSpan: number) {
    const detailRow = document.createElement("tr");
    const detail = document.createElement("td");
    detail.colSpan = colSpan;
    detail.style.cssText = "padding:12px;border:1px solid #dbe3ef;background:#f8fbff;color:#334155";
    const content = this.masterDetailRenderer?.(row);
    content instanceof Node ? detail.appendChild(content) : detail.textContent = String(content ?? "");
    detailRow.appendChild(detail);
    tbody.appendChild(detailRow);
  }

  private appendRow(tbody: HTMLTableSectionElement, row: T, rowIndex: number, columns: Column<T>[], leading: number, display?: Extract<DisplayRow<T>, { kind: "data" }>) {
    const tr = document.createElement("tr");
    const rowSelected = this.selected.has(this.rowId(row, rowIndex));
    tr.className = classNameList(
      this.classNames?.row,
      this.getRowClassName?.({ row, rowIndex, selected: rowSelected }),
    );
    tr.draggable = this.enableRowReorder || Boolean(this.presetDefaults().enableRowReorder);
    tr.addEventListener("dragstart", () => {
      if (!tr.draggable) return;
      this.draggedRowIndex = rowIndex;
    });
    tr.addEventListener("dragover", (event) => {
      if (tr.draggable) event.preventDefault();
    });
    tr.addEventListener("drop", (event) => {
      if (!tr.draggable) return;
      event.preventDefault();
      if (this.draggedRowIndex != null) this.reorderRow(this.draggedRowIndex, rowIndex);
      this.draggedRowIndex = null;
    });
    if (this.effectiveCheckboxSelection()) {
      const td = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.selected.has(this.rowId(row, rowIndex));
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.selected.add(this.rowId(row, rowIndex)) : this.selected.delete(this.rowId(row, rowIndex));
        const selectedRows = this.rows.filter((entry, index) => this.selected.has(this.rowId(entry, index)));
        this.rowSelectionChange.emit(selectedRows);
        this.selectionChanged.emit({ selectedRows, selectedRowIds: Array.from(this.selected) });
        this.rowSelected.emit({ row, rowIndex, selected: checkbox.checked, selectedRows });
        this.render();
      });
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    if (this.effectiveRowNumbers()) {
      const rowNumber = cell(String(rowIndex + 1));
      if (tr.draggable) {
        const up = this.button("↑", () => this.moveRow(rowIndex, -1));
        up.disabled = rowIndex <= 0;
        const down = this.button("↓", () => this.moveRow(rowIndex, 1));
        down.disabled = rowIndex >= this.rows.length - 1;
        rowNumber.append(" ", up, down);
      }
      tr.appendChild(rowNumber);
    }
    columns.forEach((column, columnIndex) => {
      const cellValue = value(row, column, this.columns);
      const td = cell(format(row, column, this.columns));
      const textOptions = resolveTextDisplay(this.textDisplay, column);
      td.className = classNameList(
        this.classNames?.cell,
        resolveClassName(column.className, { value: cellValue, row, rowIndex, column }),
        resolveClassName(column.cellClassName, { value: cellValue, row, rowIndex, column }),
        this.getCellClassName?.({
          value: cellValue,
          row,
          rowIndex,
          column,
          columnIndex,
          selected: rowSelected,
        }),
      );
      td.style.cssText = `padding:10px;border:1px solid #dbe3ef;width:${this.columnWidth(column)}px;white-space:${textOptions.overflow === "wrap" ? "normal" : "nowrap"};overflow:hidden;text-overflow:${textOptions.overflow === "clip" ? "clip" : "ellipsis"};${this.pinnedStyle(column, columns)}`;
      if (textOptions.overflow === "ellipsis" && textOptions.showTooltip !== false) td.title = format(row, column, this.columns);
      if (this.activeCell?.rowIndex === rowIndex && this.activeCell.columnId === column.id) {
        td.style.outline = "2px solid #2563eb";
        td.style.outlineOffset = "-2px";
      }
      if (this.isCellInRange(rowIndex, column.id, columns)) td.style.background = "rgba(37,99,235,.12)";
      if (this.findText && format(row, column, this.columns).toLowerCase().includes(this.findText.toLowerCase())) {
        td.style.background = "rgba(37,99,235,.1)";
      }
      if (this.getTreeDataPath && columnIndex === 0) {
        td.style.paddingLeft = `${12 + (display?.depth ?? Math.max(0, this.getTreeDataPath(row).length - 1)) * 24}px`;
        if (display?.hasChildren && display.treeKey) {
          const treeKey = display.treeKey;
          const toggle = this.button(this.collapsedTreeKeys.has(treeKey) ? "+" : "-", () => {
            this.collapsedTreeKeys.has(treeKey) ? this.collapsedTreeKeys.delete(treeKey) : this.collapsedTreeKeys.add(treeKey);
            this.render();
          });
          td.prepend(toggle);
        }
      } else if (this.masterDetailRenderer && columnIndex === 0) {
        const rowId = this.rowId(row, rowIndex);
        const toggle = this.button(this.expandedDetailIds.has(rowId) ? "-" : "+", () => {
          this.expandedDetailIds.has(rowId) ? this.expandedDetailIds.delete(rowId) : this.expandedDetailIds.add(rowId);
          this.render();
        });
        td.prepend(toggle);
      }
      td.addEventListener("click", (event) => {
        this.contextMenu = null;
        this.activeCell = { rowIndex, columnId: column.id };
        if (event.shiftKey && this.rangeAnchor) {
          this.rangeEnd = { rowIndex, columnId: column.id };
        } else {
          this.rangeAnchor = { rowIndex, columnId: column.id };
          this.rangeEnd = { rowIndex, columnId: column.id };
        }
        this.selectedRowChange.emit({
          row,
          rowIndex,
          selectedRows: this.rows.filter((entry, index) => this.selected.has(this.rowId(entry, index))),
        });
        this.cellClick.emit({ row, rowIndex, column });
        this.render();
      });
      td.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        this.activeCell = { rowIndex, columnId: column.id };
        this.contextMenu = { x: event.clientX, y: event.clientY, rowIndex, columnId: column.id };
        this.render();
      });
      td.addEventListener("dblclick", () => {
        this.cellDoubleClick.emit({ row, rowIndex, column });
        if (column.editable) this.editCell(td, row, rowIndex, column);
      });
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  private editCell(td: HTMLTableCellElement, row: T, rowIndex: number, column: Column<T>) {
    const oldValue = rawValue(row, column);
    const input = this.createEditor(column, oldValue);
    this.cellEditStart.emit({ row, rowIndex, column, value: oldValue });
    td.replaceChildren(input);
    input.focus();
    input.addEventListener("blur", () => {
      this.setCellValue(row, rowIndex, column, input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value);
      this.render();
    }, { once: true });
  }

  private createEditor(column: Column<T>, current: unknown) {
    const editor = column.editor;
    if (editor === "checkbox") {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(current);
      return input;
    }
    if (editor === "number" || editor === "date") {
      const input = document.createElement("input");
      input.type = editor;
      input.value = String(current ?? "");
      return input;
    }
    if (editor && typeof editor === "object" && (editor.type === "select" || editor.type === "advancedSelect")) {
      const select = document.createElement("select");
      (editor.values ?? []).forEach((item) => {
        const option = document.createElement("option");
        option.value = String(item);
        option.textContent = String(item);
        select.appendChild(option);
      });
      select.value = String(current ?? "");
      return select;
    }
    const input = document.createElement("input");
    input.value = String(current ?? "");
    return input;
  }

  private renderContextMenu() {
    const menu = document.createElement("div");
    menu.style.cssText = `position:fixed;z-index:9999;left:${this.contextMenu?.x ?? 0}px;top:${this.contextMenu?.y ?? 0}px;display:grid;min-width:150px;padding:6px;border:1px solid #dbe3ef;border-radius:10px;background:white;box-shadow:0 18px 48px rgba(15,23,42,.18)`;
    const row = this.contextMenu ? this.rows[this.contextMenu.rowIndex] : undefined;
    const column = this.columns.find((entry) => entry.id === this.contextMenu?.columnId);
    menu.append(
      this.button("Copy", () => void this.copyActiveCell()),
      this.button("Paste", () => void this.pasteActiveCell()),
      this.button("Edit cell", () => {
        if (!row || !column || column.editable === false || !this.contextMenu) return;
        const nextValue = window.prompt(`Edit ${column.headerName}`, String(rawValue(row, column) ?? ""));
        if (nextValue != null) this.setCellValue(row, this.contextMenu.rowIndex, column, nextValue);
        this.contextMenu = null;
        this.render();
      }),
      this.button("Clear cell", () => {
        if (row && column && column.editable !== false && this.contextMenu) this.setCellValue(row, this.contextMenu.rowIndex, column, "");
        this.contextMenu = null;
        this.render();
      }),
      this.button("Hide column", () => {
        if (column) this.hiddenColumnIds.add(column.id);
        this.contextMenu = null;
        this.render();
      }),
    );
    return menu;
  }

  private renderToolsPanel() {
    const panel = document.createElement("div");
    panel.style.cssText = `flex:1 1 100%;z-index:10001;width:min(720px,calc(100vw - 24px));max-width:100%;max-height:min(620px,calc(100vh - 96px));overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:12px;border:1px solid #dbe3ef;border-radius:12px;background:#f8fbff;box-shadow:0 18px 48px rgba(15,23,42,.18)`;
    const columnsSection = document.createElement("section");
    columnsSection.appendChild(document.createElement("strong")).textContent = "Columns";
    this.columns.forEach((column) => {
      const label = document.createElement("label");
      label.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:6px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !this.hiddenColumnIds.has(column.id);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.hiddenColumnIds.delete(column.id) : this.hiddenColumnIds.add(column.id);
        this.columnVisible.emit({
          columnId: column.id,
          visible: checkbox.checked,
          hiddenColumnIds: Array.from(this.hiddenColumnIds),
        });
        this.render();
      });
      label.append(checkbox, column.headerName);
      columnsSection.appendChild(label);
    });

    const pivotSection = document.createElement("section");
    pivotSection.appendChild(document.createElement("strong")).textContent = "Pivot";
    pivotSection.append(
      this.select("Row group", this.groupBy, "No group", (value) => this.updatePivot({ groupBy: value as keyof T & string | undefined })),
      this.select("Pivot by", this.pivotBy, "Pivot off", (value) => this.updatePivot({ pivotBy: value as keyof T & string | undefined })),
      this.select("Value", this.pivotValueColumns?.[0], "No value", (value) => this.updatePivot({ pivotValueColumns: value ? [value as keyof T & string] : [] })),
      this.select("Aggregation", this.pivotAggregation, "", (value) => this.updatePivot({ pivotAggregation: value as PivotAggregation }), ["sum", "avg", "count", "min", "max"]),
    );

    const filterSection = document.createElement("section");
    filterSection.appendChild(document.createElement("strong")).textContent = "Advanced filter";
    const columnSelect = this.select("", this.columns[0]?.id, "", () => undefined, this.columns.map((column) => column.id));
    const operatorSelect = this.select("", "contains", "", () => undefined, ["contains", "equals", "gt", "gte", "lt", "lte", "blank", "notBlank"]);
    const valueInput = document.createElement("input");
    valueInput.placeholder = "Value";
    valueInput.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
    const apply = this.button("Apply", () => {
      this.updateAdvancedFilter(
        (columnSelect.querySelector("select") as HTMLSelectElement).value,
        (operatorSelect.querySelector("select") as HTMLSelectElement).value as ColumnFilterModel["operator"],
        valueInput.value,
      );
    });
    const clear = this.button("Clear", () => {
      this.advancedFilterModel = null;
      this.advancedFilterModelChange.emit(null);
      this.render();
    });
    filterSection.append(columnSelect, operatorSelect, valueInput, apply, clear);

    panel.append(columnsSection, pivotSection, filterSection);
    return panel;
  }

  private select(labelText: string, value: string | undefined, emptyLabel: string, onChange: (value: string | undefined) => void, fixedOptions?: string[]) {
    const label = document.createElement("label");
    label.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:6px";
    if (labelText) label.append(`${labelText} `);
    const select = document.createElement("select");
    select.style.cssText = "min-height:32px;padding:0 8px;border:1px solid #bfdbfe;border-radius:8px";
    if (emptyLabel) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = emptyLabel;
      select.appendChild(option);
    }
    (fixedOptions ?? this.columns.map((column) => String(column.field))).forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry;
      option.textContent = this.columns.find((column) => column.id === entry || column.field === entry)?.headerName ?? entry;
      select.appendChild(option);
    });
    select.value = value ?? "";
    select.addEventListener("change", () => onChange(select.value || undefined));
    label.appendChild(select);
    return label;
  }

  private renderStatus(totalRows: number) {
    const footer = this.effectiveFooter();
    if (footer === false) return document.createDocumentFragment();
    const columns = this.columns.filter((column) => !this.hiddenColumnIds.has(column.id) && !column.hidden);
    const visibleRows = this.visibleRows();
    const summaryOptions = resolveSummaryOptions(this.summaries);
    const footerOptions = {
      rowCount: true,
      selectedRows: true,
      selectedCell: true,
      selectedRange: true,
      filterCount: true,
      sortStatus: true,
      pagination: true,
      ...(typeof footer === "object" ? footer : {}),
    };
    const status = document.createElement("div");
    status.style.cssText = "display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:10px;border:1px solid #dbe3ef;border-top:0;font-weight:700";
    const state = {
      rowCountLabel: `${totalRows} rows`,
      selectedRowsLabel: `${this.selected.size} selected`,
      activeCellLabel: this.activeCell ? `Cell ${this.activeCell.rowIndex + 1}:${this.activeCell.columnId}` : "No cell",
      selectedRangeLabel: this.rangeAnchor && this.rangeEnd ? "Range selected" : "No range",
      summaryLabel: summaryOptions.footer
        ? buildSummaryLabel(
            visibleRows.flatMap((row) => columns.map((column) => value(row, column, this.columns))),
            "No numeric values",
          )
        : "",
      selectedRangeSummaryLabel:
        summaryOptions.selectedRange && this.rangeAnchor && this.rangeEnd
          ? buildSummaryLabel(
              visibleRows
                .slice(Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex), Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex) + 1)
                .flatMap((row) =>
                  columns
                    .slice(
                      Math.min(
                        columns.findIndex((column) => column.id === this.rangeAnchor?.columnId),
                        columns.findIndex((column) => column.id === this.rangeEnd?.columnId),
                      ),
                      Math.max(
                        columns.findIndex((column) => column.id === this.rangeAnchor?.columnId),
                        columns.findIndex((column) => column.id === this.rangeEnd?.columnId),
                      ) + 1,
                    )
                    .map((column) => value(row, column, this.columns)),
                ),
              "No numeric values in range",
            )
          : "",
      filterCountLabel: `${Object.keys(this.columnFilters ?? {}).length + Number(Boolean(this.advancedFilterModel))} filters`,
      sortStatusLabel: this.sortState ? `Sorted ${this.sortState.direction}` : "Unsorted",
      pageIndex: this.pageIndex,
      pageCount: this.effectivePageSize() ? Math.max(1, Math.ceil(totalRows / this.effectivePageSize()!)) : 1,
    };
    const renderer = typeof footer === "object" ? footer.renderer : undefined;
    if (typeof renderer === "function") {
      const content = renderer(state);
      content instanceof Node ? status.appendChild(content) : status.append(String(content ?? ""));
      return status;
    }
    if (footerOptions.rowCount) status.append(state.rowCountLabel);
    if (footerOptions.selectedRows) status.append(state.selectedRowsLabel);
    if (footerOptions.selectedCell) status.append(state.activeCellLabel);
    if (footerOptions.sortStatus) status.append(state.sortStatusLabel);
    if (summaryOptions.footer && state.summaryLabel) status.append(state.summaryLabel);
    if (summaryOptions.selectedRange && state.selectedRangeSummaryLabel) status.append(state.selectedRangeSummaryLabel);
    if (footerOptions.filterCount) status.append(state.filterCountLabel);
    if (footerOptions.selectedRange) status.append(state.selectedRangeLabel);
    const toolbar = this.effectiveToolbar();
    const paginationEnabled =
      toolbar === undefined ||
      toolbar === true ||
      (typeof toolbar === "object" &&
        Boolean((toolbar as Record<string, boolean>).pagination || (toolbar as Record<string, boolean>).prevNextPage));
    if (footerOptions.pagination && paginationEnabled && this.effectivePageSize()) {
      const pageCount = state.pageCount;
      const pager = document.createElement("span");
      pager.style.marginLeft = "auto";
      const prev = this.button("Prev", () => {
        this.pageIndex = Math.max(0, this.pageIndex - 1);
        this.render();
      });
      prev.disabled = this.pageIndex <= 0;
      const next = this.button("Next", () => {
        this.pageIndex = Math.min(pageCount - 1, this.pageIndex + 1);
        this.render();
      });
      next.disabled = this.pageIndex >= pageCount - 1;
      pager.append(prev, ` Page ${this.pageIndex + 1} of ${pageCount} `, next);
      status.appendChild(pager);
    }
    return status;
  }

  private button(text: string, onClick: () => void) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px;background:#fff;color:#1d4ed8;font-weight:800";
    button.addEventListener("click", onClick);
    return button;
  }
}
