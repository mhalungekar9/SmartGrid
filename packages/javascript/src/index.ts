import type {
  AdvancedFilterModel,
  Column,
  ColumnFilterModel,
  GridOptions,
  GridNexaApi,
  GridNexaClassName,
  GridNexaColumnToolOptions,
  GridNexaFillWidthOptions,
  GridNexaSidePanelOptions,
  GridNexaTextDisplayOptions,
  GridNexaAiRequest,
  GridNexaCommandAction,
  GridNexaCommandPlan,
  MergedHeader,
  PivotAggregation,
} from "@gridnexa/core";

export * from "@gridnexa/core";

export interface GridNexaJavaScriptOptions<T = Record<string, unknown>>
  extends GridOptions<T> {
  pageSize?: number;
  groupBy?: keyof T & string;
  height?: number | string;
  columnTools?: GridNexaColumnToolOptions;
  textDisplay?: GridNexaTextDisplayOptions;
  createRow?: () => T;
  apiRef?: { current: GridNexaApi<T> | null };
  onDataChange?: (params: { rows: T[]; previousRows: T[]; reason: string }) => void;
  onRowAdd?: (params: { row: T; rowIndex: number; rows: T[] }) => void;
  onRowDelete?: (params: { row: T; rowIndex: number; rows: T[]; remainingRows: T[] }) => void;
  onRowsDelete?: (params: { rows: T[]; rowIndexes: number[]; remainingRows: T[] }) => void;
  onCellClick?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
    columnIndex: number;
    value: unknown;
  }) => void;
}

type SortState = { columnId: string; direction: "asc" | "desc" } | null;
type CellPoint = { rowIndex: number; columnId: string };
type CellEdit<T> = {
  row: T;
  rowIndex: number;
  column: Column<T>;
  oldValue: unknown;
  newValue: unknown;
};
type DisplayRow<T> =
  | { kind: "group"; key: string; label: string; rows: T[]; summaries: string }
  | { kind: "data"; row: T; rowIndex: number; depth?: number; treeKey?: string; hasChildren?: boolean }
  | { kind: "detail"; row: T; rowIndex: number; key: string };

const styleId = "gridnexa-javascript-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .gnx-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;border:1px solid rgba(30,64,175,.16);border-radius:12px;background:#fff;color:#0f172a;font:14px/1.45 Inter,"Segoe UI",system-ui,sans-serif;overflow:hidden;box-shadow:0 18px 48px rgba(15,23,42,.12);--gnx-bg:#fff;--gnx-header-bg:#f8fbff;--gnx-border:rgba(30,64,175,.16);--gnx-row-hover:rgba(37,99,235,.07);--gnx-primary:#2563eb}
    .gnx-main{min-width:0;overflow:auto}.gnx-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border-bottom:1px solid rgba(30,64,175,.12);background:#f8fbff}.gnx-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
    .gnx-button,.gnx-panel button{min-height:32px;padding:0 10px;border:1px solid rgba(30,64,175,.16);border-radius:8px;background:#fff;color:#1d4ed8;font:inherit;font-weight:800;cursor:pointer}.gnx-button:disabled{opacity:.48;cursor:not-allowed}
    .gnx-table{width:max-content;min-width:max-content;border-collapse:separate;border-spacing:0}.gnx-grid[data-gnx-fill-width=true] .gnx-table{width:100%}.gnx-table th,.gnx-table td{min-height:42px;padding:10px 12px;border-right:1px solid var(--gnx-border);border-bottom:1px solid rgba(30,64,175,.1);text-align:left;white-space:nowrap}
    .gnx-table th{position:sticky;top:0;z-index:1;background:var(--gnx-header-bg);color:#172033;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;user-select:none}.gnx-table th[draggable=true]{cursor:grab}.gnx-table thead tr:first-child th{background:#e8f1ff;color:#153e90;text-align:center}.gnx-table tbody tr:hover td{background:var(--gnx-row-hover)}
    .gnx-cell-ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gnx-cell-clip{white-space:nowrap;overflow:hidden;text-overflow:clip}.gnx-cell-wrap{white-space:normal;overflow-wrap:anywhere;text-overflow:clip}
    .gnx-control{width:44px;text-align:center!important}.gnx-detail{background:#f8fbff;color:#334155}.gnx-empty{padding:18px;color:#64748b}.gnx-status{display:flex;gap:18px;flex-wrap:wrap;padding:10px 12px;border-top:1px solid rgba(30,64,175,.12);font-size:12px;font-weight:800;color:#334155;background:#fff}.gnx-find{min-height:32px;padding:0 9px;border:1px solid rgba(30,64,175,.16);border-radius:8px}.gnx-cell-active{outline:2px solid #2563eb;outline-offset:-2px;background:rgba(37,99,235,.08)!important}.gnx-cell-range{background:rgba(37,99,235,.12)!important}.gnx-row-tools{display:inline-flex;gap:3px}.gnx-row-tools button{min-height:24px;padding:0 5px;border:1px solid rgba(30,64,175,.14);border-radius:6px;background:#fff;color:#1d4ed8;font-weight:900}.gnx-drop-target{box-shadow:inset 3px 0 #2563eb}.gnx-resizer{float:right;width:7px;height:24px;cursor:col-resize;border-right:2px solid rgba(30,64,175,.24)}.gnx-group-row td{background:#eef4ff!important;color:#153e90;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.gnx-tree-toggle,.gnx-detail-toggle{min-height:24px;margin-right:6px;border:1px solid rgba(30,64,175,.18);border-radius:6px;background:#fff;color:#1d4ed8;font-weight:900}.gnx-context{position:fixed;z-index:9999;display:grid;min-width:150px;padding:6px;border:1px solid rgba(30,64,175,.16);border-radius:10px;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.18)}.gnx-context button{min-height:30px;border:0;background:transparent;text-align:left;color:#0f172a;font:inherit}.gnx-context button:hover{background:#eef4ff}
    .gnx-side{position:relative;z-index:2;display:flex;min-width:42px;border-left:1px solid rgba(30,64,175,.14);background:#f8fbff;overflow:hidden}.gnx-tabs{display:grid;grid-auto-rows:116px;width:42px;background:#eef4ff}.gnx-tab{border:0;border-bottom:1px solid rgba(30,64,175,.12);background:transparent;color:#334155;cursor:pointer;touch-action:manipulation;font:inherit;font-weight:800;writing-mode:vertical-rl}.gnx-tab.active,.gnx-tab:hover{background:rgba(37,99,235,.1);color:#1d4ed8}
    .gnx-panel{width:min(340px,calc(100vw - 64px));max-height:620px;overflow:auto;padding:14px;background:#fff;box-shadow:-18px 0 42px rgba(15,23,42,.1)}.gnx-panel h3{margin:0 0 8px;font-size:14px}.gnx-section{display:grid;gap:8px;padding:12px 0;border-top:1px solid rgba(30,64,175,.12)}.gnx-panel label{display:flex;align-items:center;gap:8px;min-height:30px}.gnx-panel select,.gnx-panel input{min-height:34px;padding:0 9px;border:1px solid rgba(30,64,175,.16);border-radius:8px;background:#fff;color:#0f172a}.gnx-rule{display:grid;gap:8px;padding:10px;border:1px solid rgba(30,64,175,.12);border-radius:10px;background:#f8fbff}
    @media(max-width:900px){.gnx-grid{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto;overflow:visible}.gnx-side{width:100%;border-top:1px solid rgba(30,64,175,.14);border-left:0;overflow:visible}.gnx-tabs{grid-auto-flow:column;grid-auto-columns:minmax(96px,1fr);grid-auto-rows:auto;width:100%}.gnx-tab{min-height:42px;writing-mode:horizontal-tb}.gnx-panel{position:fixed;right:12px;bottom:64px;left:12px;z-index:10020;width:auto;max-height:min(70vh,620px);border:1px solid rgba(30,64,175,.16);border-radius:14px;box-shadow:0 24px 80px rgba(15,23,42,.32)}}
  `;
  document.head.appendChild(style);
}

function getValue<T>(row: T, column: Column<T>) {
  return column.valueGetter ? column.valueGetter(row) : row[column.field];
}

function evaluateFormula<T>(row: T, columns: Column<T>[], expression: string) {
  const formula = expression.trim().slice(1);

  if (!/^[\w\s.+\-*/()%]+$/.test(formula)) {
    return expression;
  }

  const resolved = columns.reduce((current, column) => {
    const raw = column.valueGetter ? column.valueGetter(row) : row[column.field];
    const numeric = Number(raw);

    return current.replace(
      new RegExp(`\\b${column.id}\\b|\\b${String(column.field)}\\b`, "g"),
      Number.isFinite(numeric) ? String(numeric) : "0",
    );
  }, formula);

  try {
    return Function(`"use strict"; return (${resolved});`)();
  } catch {
    return expression;
  }
}

function getResolvedValue<T>(row: T, column: Column<T>, columns: Column<T>[]) {
  const value = getValue(row, column);

  return typeof value === "string" && value.trim().startsWith("=")
    ? evaluateFormula(row, columns, value)
    : value;
}

function formatValue<T>(row: T, column: Column<T>, columns: Column<T>[] = [column]) {
  const value = getResolvedValue(row, column, columns);
  return column.valueFormatter ? column.valueFormatter(value) : value == null ? "" : String(value);
}

function matchesColumnFilter<T>(row: T, column: Column<T>, filter: ColumnFilterModel) {
  const raw = getValue(row, column);
  const text = String(raw ?? "").toLowerCase();
  const value = String(filter.value ?? "").toLowerCase();
  const numeric = Number(raw);
  const from = Number(filter.value);
  const to = Number(filter.valueTo);

  if (filter.operator === "blank") return !text.trim();
  if (filter.operator === "notBlank") return Boolean(text.trim());
  if (filter.operator === "in") return (filter.values ?? []).map(String).includes(String(raw ?? ""));
  if (!value) return true;
  if (filter.operator === "equals") return text === value;
  if (filter.operator === "startsWith") return text.startsWith(value);
  if (filter.operator === "endsWith") return text.endsWith(value);
  if (filter.operator === "gt") return numeric > from;
  if (filter.operator === "gte") return numeric >= from;
  if (filter.operator === "lt") return numeric < from;
  if (filter.operator === "lte") return numeric <= from;
  if (filter.operator === "between") return numeric >= from && numeric <= to;
  return text.includes(value);
}

function isAdvancedActive(model?: AdvancedFilterModel | null): boolean {
  if (!model) return false;
  if (model.kind === "group") return model.conditions.some(isAdvancedActive);
  if (model.operator === "blank" || model.operator === "notBlank") return true;
  if (model.operator === "in") return Boolean(model.values?.length);
  return model.value != null && String(model.value).trim() !== "";
}

function matchesAdvanced<T>(row: T, columns: Column<T>[], model?: AdvancedFilterModel | null): boolean {
  if (!model || !isAdvancedActive(model)) return true;
  if (model.kind === "group") {
    const active = model.conditions.filter(isAdvancedActive);
    return model.joinOperator === "or"
      ? active.some((condition) => matchesAdvanced(row, columns, condition))
      : active.every((condition) => matchesAdvanced(row, columns, condition));
  }
  const column = columns.find((entry) => entry.id === model.columnId);
  return column
    ? matchesColumnFilter(row, column, {
        operator: model.operator,
        value: model.value,
        valueTo: model.valueTo,
        values: model.values,
      })
    : true;
}

function aggregate(values: unknown[], aggregation: PivotAggregation) {
  if (aggregation === "count") return values.length;
  const numbers = values.map(Number).filter((value) => !Number.isNaN(value));
  if (!numbers.length) return 0;
  if (aggregation === "avg") return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  if (aggregation === "min") return Math.min(...numbers);
  if (aggregation === "max") return Math.max(...numbers);
  return numbers.reduce((sum, value) => sum + value, 0);
}

function buildPivot<T>(options: GridNexaJavaScriptOptions<T>, rows: T[]) {
  const { groupBy, pivotBy, pivotAggregation = "sum" } = options;
  if (!pivotBy) return { columns: options.columns, rows };
  const valueFields = options.pivotValueColumns?.length
    ? options.pivotValueColumns
    : options.columns
        .filter((column) => rows.some((row) => typeof getValue(row, column) === "number"))
        .map((column) => column.field as keyof T & string);
  const pivots = Array.from(new Set(rows.map((row) => String(row[pivotBy] ?? "Blank"))));
  const groups = Array.from(new Set(rows.map((row) => String(groupBy ? row[groupBy] : "Total"))));
  const columns: Column<Record<string, unknown>>[] = [
    { id: "__group", field: "__group", headerName: groupBy ?? "Group", width: 180 },
    ...pivots.flatMap((pivot) =>
      valueFields.map((field) => ({
        id: `${pivot}_${String(field)}`,
        field: `${pivot}_${String(field)}`,
        headerName: `${pivot} ${String(field)}`,
        width: 140,
      })),
    ),
  ];
  const pivotRows = groups.map((group) => {
    const output: Record<string, unknown> = { __group: group };
    pivots.forEach((pivot) => {
      const bucket = rows.filter(
        (row) =>
          String(row[pivotBy] ?? "Blank") === pivot &&
          String(groupBy ? row[groupBy] : "Total") === group,
      );
      valueFields.forEach((field) => {
        output[`${pivot}_${String(field)}`] = aggregate(bucket.map((row) => row[field]), pivotAggregation);
      });
    });
    return output;
  });
  return { columns: columns as Column<T>[], rows: pivotRows as T[] };
}

function buildGroupSummary<T>(rows: T[], columns: Column<T>[], groupBy?: keyof T & string) {
  return columns
    .filter((column) => column.field !== groupBy)
    .map((column) => {
      const values = rows.map((row) => Number(getResolvedValue(row, column, columns))).filter(Number.isFinite);
      return values.length ? `${column.headerName}: ${values.reduce((sum, value) => sum + value, 0).toLocaleString()}` : "";
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

function resolveToolOptions<T>(options: GridNexaJavaScriptOptions<T>, column?: Column<T>) {
  const apply = (current: typeof defaultColumnTools, value: unknown) => {
    if (value === undefined) return current;
    if (typeof value === "boolean") {
      return Object.fromEntries(Object.keys(current).map((key) => [key, value])) as typeof defaultColumnTools;
    }
    return { ...current, ...(value as Partial<typeof defaultColumnTools>) };
  };

  return apply(apply(defaultColumnTools, options.columnTools), (column as Column<T> & { tools?: unknown } | undefined)?.tools);
}

function resolveTextDisplay<T>(options: GridNexaJavaScriptOptions<T>, column: Column<T>) {
  return {
    overflow: "ellipsis" as const,
    showTooltip: true,
    ...(options.textDisplay ?? {}),
    ...((column as Column<T> & { textDisplay?: { overflow?: "ellipsis" | "wrap" | "clip"; showTooltip?: boolean } }).textDisplay ?? {}),
  };
}

function estimateWidth(value: unknown) {
  return String(value ?? "").length * 8 + 44;
}

function resolveSidePanelOptions(value?: GridNexaSidePanelOptions) {
  if (value === false) {
    return { enabled: false, columns: false, pivot: false, filters: false, defaultActivePanel: null as null };
  }

  const next = {
    enabled: true,
    columns: true,
    pivot: true,
    filters: true,
    defaultActivePanel: null as "columns" | "pivot" | "filters" | null,
    ...(value && typeof value === "object" ? value : {}),
  };
  const hasPanels = Boolean(next.columns || next.pivot || next.filters);

  return { ...next, enabled: Boolean(next.enabled && hasPanels) };
}

function resolveFillWidthOptions(value?: GridNexaFillWidthOptions) {
  if (value === true) return { enabled: true, mode: "flexOrLast" as const };
  if (value === false || value === undefined) return { enabled: false, mode: "flexOrLast" as const };
  return { enabled: value.enabled ?? true, mode: value.mode ?? "flexOrLast" as const };
}

export class GridNexaGrid<T = Record<string, unknown>> {
  private options: GridNexaJavaScriptOptions<T>;
  private sortState: SortState = null;
  private selectedIds = new Set<string | number>();
  private pageIndex = 0;
  private sideOpen: "columns" | "filters" | null = null;
  private activeCell: CellPoint | null = null;
  private rangeAnchor: CellPoint | null = null;
  private rangeEnd: CellPoint | null = null;
  private contextMenu: { x: number; y: number; rowIndex: number; columnId: string } | null = null;
  private expandedDetailIds = new Set<string | number>();
  private collapsedGroups = new Set<string>();
  private collapsedTreeKeys = new Set<string>();
  private findText = "";
  private hiddenColumnIds = new Set<string>();
  private columnOrder: string[] = [];
  private columnWidths = new Map<string, number>();
  private draggedColumnId: string | null = null;
  private draggedRowIndex: number | null = null;
  private aiPrompt = "";
  private aiPlan: GridNexaCommandPlan | null = null;
  private aiBusy = false;
  private aiError: string | null = null;
  private undoStack: Array<CellEdit<T>> = [];
  private redoStack: Array<CellEdit<T>> = [];

  constructor(private readonly container: HTMLElement, options: GridNexaJavaScriptOptions<T>) {
    this.options = options;
    const sidePanel = resolveSidePanelOptions(options.sidePanel);
    this.sideOpen =
      sidePanel.enabled && sidePanel.defaultActivePanel
        ? sidePanel.defaultActivePanel === "filters"
          ? "filters"
          : "columns"
        : null;
    this.columnOrder = options.columns.map((column) => column.id);
    options.columns.forEach((column) => {
      if (column.width) this.columnWidths.set(column.id, column.width);
    });
    this.hiddenColumnIds = new Set(options.columns.filter((column) => column.hidden).map((column) => column.id));
    injectStyles();
    this.applyTransaction();
    this.bindKeyboard();
    this.attachApi();
    this.render();
  }

  update(options: Partial<GridNexaJavaScriptOptions<T>>) {
    this.options = { ...this.options, ...options };
    const sidePanel = resolveSidePanelOptions(this.options.sidePanel);
    if (!sidePanel.enabled) this.sideOpen = null;
    if (this.sideOpen === "columns" && !sidePanel.columns && !sidePanel.pivot) this.sideOpen = null;
    if (this.sideOpen === "filters" && !sidePanel.filters) this.sideOpen = null;
    const knownColumns = new Set(this.columnOrder);
    this.options.columns.forEach((column) => {
      if (!knownColumns.has(column.id)) this.columnOrder.push(column.id);
      if (column.hidden) this.hiddenColumnIds.add(column.id);
    });
    this.applyTransaction();
    this.attachApi();
    this.render();
  }

  destroy() {
    this.container.replaceChildren();
    this.selectedIds.clear();
  }

  getRows() {
    return this.options.rows;
  }

  setRows(rows: T[]) {
    const previousRows = this.options.rows;
    this.options = { ...this.options, rows };
    this.emitRowsChange(rows, previousRows, "transaction");
    this.render();
  }

  addRow(row = this.createRow()) {
    const previousRows = this.options.rows;
    const rows = [...previousRows, row];
    this.options = { ...this.options, rows };
    this.emitRowsChange(rows, previousRows, "rowAdd");
    this.options.onRowAdd?.({ row, rowIndex: rows.length - 1, rows });
    this.render();
  }

  deleteRow(rowIndex: number) {
    const row = this.options.rows[rowIndex];
    if (!row) return;
    const previousRows = this.options.rows;
    const rows = previousRows.filter((_, index) => index !== rowIndex);
    this.options = { ...this.options, rows };
    this.selectedIds.delete(this.getRowId(row, rowIndex));
    this.emitRowsChange(rows, previousRows, "rowDelete");
    this.options.onRowDelete?.({ row, rowIndex, rows: [row], remainingRows: rows });
    this.render();
  }

  deleteSelectedRows() {
    const previousRows = this.options.rows;
    const rowIndexes: number[] = [];
    const rowsToDelete = previousRows.filter((row, index) => {
      const selected = this.selectedIds.has(this.getRowId(row, index));
      if (selected) rowIndexes.push(index);
      return selected;
    });
    if (!rowsToDelete.length) return;
    const rows = previousRows.filter((row, index) => !this.selectedIds.has(this.getRowId(row, index)));
    this.options = { ...this.options, rows };
    this.selectedIds.clear();
    this.emitRowsChange(rows, previousRows, "rowsDelete");
    this.options.onRowsDelete?.({ rows: rowsToDelete, rowIndexes, remainingRows: rows });
    this.render();
  }

  saveAll() {
    this.options.onSaveAll?.({
      rows: this.options.rows,
      selectedRows: this.options.rows.filter((row, index) => this.selectedIds.has(this.getRowId(row, index))),
      visibleRows: this.visibleRows(),
      reason: "api",
    });
  }

  private createRow() {
    if (this.options.createRow) return this.options.createRow();
    return Object.fromEntries(this.options.columns.map((column) => [column.field, ""])) as T;
  }

  private emitRowsChange(rows: T[], previousRows: T[], reason: string) {
    const params = { rows, previousRows, reason };
    this.options.onRowsChange?.(params as Parameters<NonNullable<GridNexaJavaScriptOptions<T>["onRowsChange"]>>[0]);
    this.options.onDataChange?.(params);
  }

  private getRowId(row: T, index: number) {
    return this.options.getRowId?.(row, index) ?? index;
  }

  private attachApi() {
    if (!this.options.apiRef) return;
    this.options.apiRef.current = {
      getRows: () => this.getRows(),
      setRows: (rows: T[]) => this.setRows(rows),
      addRow: (row?: T) => this.addRow(row),
      deleteRow: (rowIndex: number) => this.deleteRow(rowIndex),
      deleteSelectedRows: () => this.deleteSelectedRows(),
      saveAll: () => this.saveAll(),
    };
  }

  private effectiveColumns() {
    const columnsById = new Map(this.options.columns.map((column) => [column.id, column]));
    const ordered = [
      ...this.columnOrder.map((columnId) => columnsById.get(columnId)).filter((column): column is Column<T> => Boolean(column)),
      ...this.options.columns.filter((column) => !this.columnOrder.includes(column.id)),
    ];

    return ordered
      .filter((column) => !this.hiddenColumnIds.has(column.id))
      .sort((left, right) => {
        const lane = (column: Column<T>) => (column.pinned === "left" ? 0 : column.pinned === "right" ? 2 : 1);
        return lane(left) - lane(right);
      });
  }

  private makeDisplayRows(rows: T[]): Array<DisplayRow<T>> {
    if (this.options.groupBy) {
      const buckets = new Map<string, T[]>();
      rows.forEach((row) => {
        const key = String(row[this.options.groupBy as keyof T] ?? "Ungrouped");
        buckets.set(key, [...(buckets.get(key) ?? []), row]);
      });

      return Array.from(buckets.entries()).flatMap(([key, bucket]) => [
        { kind: "group" as const, key, label: key, rows: bucket, summaries: buildGroupSummary(bucket, this.options.columns, this.options.groupBy) },
        ...(this.collapsedGroups.has(key)
          ? []
          : bucket.map((row) => ({ kind: "data" as const, row, rowIndex: this.options.rows.indexOf(row) }))),
      ]);
    }

    if (this.options.getTreeDataPath) {
      return rows
        .map((row) => {
          const path = this.options.getTreeDataPath?.(row).filter(Boolean) ?? [];
          return { row, path, key: path.join("/") };
        })
        .sort((left, right) => left.key.localeCompare(right.key))
        .filter((entry) =>
          entry.path
            .slice(0, -1)
            .every((_, index) => !this.collapsedTreeKeys.has(entry.path.slice(0, index + 1).join("/"))),
        )
        .map((entry, index, entries) => ({
          kind: "data" as const,
          row: entry.row,
          rowIndex: this.options.rows.indexOf(entry.row),
          depth: Math.max(0, entry.path.length - 1),
          treeKey: entry.key,
          hasChildren: entries.some((other) => other.key.startsWith(`${entry.key}/`)),
        }));
    }

    return rows.map((row) => ({ kind: "data", row, rowIndex: this.options.rows.indexOf(row) }));
  }

  private isCellInRange(rowIndex: number, columnId: string, columns: Column<T>[]) {
    if (!this.rangeAnchor || !this.rangeEnd || this.options.enableRangeSelection === false) return false;
    const columnIndex = columns.findIndex((column) => column.id === columnId);
    const anchorIndex = columns.findIndex((column) => column.id === this.rangeAnchor?.columnId);
    const endIndex = columns.findIndex((column) => column.id === this.rangeEnd?.columnId);
    const minRow = Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
    const maxRow = Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
    const minColumn = Math.min(anchorIndex, endIndex);
    const maxColumn = Math.max(anchorIndex, endIndex);

    return rowIndex >= minRow && rowIndex <= maxRow && columnIndex >= minColumn && columnIndex <= maxColumn;
  }

  private bindKeyboard() {
    this.container.tabIndex = this.container.tabIndex >= 0 ? this.container.tabIndex : 0;
    this.container.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && this.options.enableUndoRedo !== false) {
        event.preventDefault();
        this.undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y" && this.options.enableUndoRedo !== false) {
        event.preventDefault();
        this.redo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        void this.copyActiveCell();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        void this.pasteActiveCell();
      }
    });

    document.addEventListener("click", () => {
      if (this.contextMenu) {
        this.contextMenu = null;
        this.render();
      }
    });
  }

  private applyTransaction() {
    const transaction = this.options.transaction;
    if (!transaction) return;
    const removeIds = new Set((transaction.remove ?? []).map((row, index) => this.getRowId(row, index)));
    const updates = new Map((transaction.update ?? []).map((row, index) => [this.getRowId(row, index), row]));
    this.options = {
      ...this.options,
      rows: [
        ...this.options.rows
          .filter((row, index) => !removeIds.has(this.getRowId(row, index)))
          .map((row, index) => updates.get(this.getRowId(row, index)) ?? row),
        ...(transaction.add ?? []),
      ],
      transaction: undefined,
    };
  }

  private visibleRows() {
    const query = (this.options.quickFilterText ?? "").trim().toLowerCase();
    const rows = this.options.rows.filter((row) => {
      if (this.options.externalFilter && !this.options.externalFilter(row)) return false;
      if (this.options.advancedFilter && !this.options.advancedFilter(row)) return false;
      if (!matchesAdvanced(row, this.options.columns, this.options.advancedFilterModel)) return false;
      if (query && !this.options.columns.some((column) => String(getValue(row, column) ?? "").toLowerCase().includes(query))) return false;
      return Object.entries(this.options.columnFilters ?? {}).every(([columnId, filter]) => {
        const column = this.options.columns.find((entry) => entry.id === columnId);
        return column ? matchesColumnFilter(row, column, filter) : true;
      });
    });
    if (!this.sortState) return rows;
    const column = this.options.columns.find((entry) => entry.id === this.sortState?.columnId);
    if (!column) return rows;
    return [...rows].sort((left, right) => {
      const comparison = String(getValue(left, column) ?? "").localeCompare(String(getValue(right, column) ?? ""), undefined, { numeric: true });
      return this.sortState?.direction === "asc" ? comparison : -comparison;
    });
  }

  private pageRows(rows: T[]) {
    const pageSize = this.options.pageSize;
    if (!pageSize || pageSize <= 0) return rows;
    return rows.slice(this.pageIndex * pageSize, this.pageIndex * pageSize + pageSize);
  }

  private setPivot(next: Partial<GridNexaJavaScriptOptions<T>>) {
    this.options = { ...this.options, ...next };
    this.options.onPivotModelChange?.({
      groupBy: this.options.groupBy,
      pivotBy: this.options.pivotBy,
      pivotValueColumns: this.options.pivotValueColumns ?? [],
      pivotAggregation: this.options.pivotAggregation ?? "sum",
    });
    this.pageIndex = 0;
    this.render();
  }

  private download(filename: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private exportCsv(columns: Column<T>[], rows: T[]) {
    const csv = [
      columns.map((column) => JSON.stringify(column.headerName)).join(","),
      ...rows.map((row) => columns.map((column) => JSON.stringify(formatValue(row, column, this.options.columns))).join(",")),
    ].join("\n");
    this.download("gridnexa-export.csv", csv, "text/csv;charset=utf-8");
  }

  private exportExcel(columns: Column<T>[], rows: T[]) {
    const html = `<table><thead><tr>${columns.map((column) => `<th>${column.headerName}</th>`).join("")}</tr></thead><tbody>${rows
      .map((row) => `<tr>${columns.map((column) => `<td>${formatValue(row, column, this.options.columns)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;

    this.download("gridnexa-export.xls", html, "application/vnd.ms-excel;charset=utf-8");
  }

  private setCellValue(row: T, rowIndex: number, column: Column<T>, newValue: unknown, trackHistory = true) {
    const oldValue = getValue(row, column);
    const parsedValue = typeof oldValue === "number" ? Number(newValue) : newValue;

    if (trackHistory && this.options.enableUndoRedo !== false) {
      this.undoStack.push({ row, rowIndex, column, oldValue, newValue: parsedValue });
      this.redoStack = [];
    }

    (row as Record<string, unknown>)[column.field] = parsedValue;
    this.options.onCellValueChange?.({ row, rowIndex, column, oldValue, newValue: parsedValue });
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

  private async copyActiveCell() {
    if (!this.activeCell || typeof navigator === "undefined") return;
    if (this.rangeAnchor && this.rangeEnd) {
      const columns = this.effectiveColumns();
      const anchorColumn = columns.findIndex((entry) => entry.id === this.rangeAnchor?.columnId);
      const endColumn = columns.findIndex((entry) => entry.id === this.rangeEnd?.columnId);
      const minRow = Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
      const maxRow = Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
      const minColumn = Math.min(anchorColumn, endColumn);
      const maxColumn = Math.max(anchorColumn, endColumn);
      const text = this.options.rows
        .slice(minRow, maxRow + 1)
        .map((row) =>
          columns
            .slice(minColumn, maxColumn + 1)
            .map((column) => formatValue(row, column, this.options.columns))
            .join("\t"),
        )
        .join("\n");
      await navigator.clipboard?.writeText(text);
      return;
    }
    const row = this.options.rows[this.activeCell.rowIndex];
    const column = this.options.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (!row || !column) return;
    await navigator.clipboard?.writeText(formatValue(row, column, this.options.columns));
  }

  private async pasteActiveCell() {
    if (!this.activeCell || typeof navigator === "undefined") return;
    const value = await navigator.clipboard?.readText();
    const columns = this.effectiveColumns();
    const startColumnIndex = columns.findIndex((entry) => entry.id === this.activeCell?.columnId);
    value.split(/\r?\n/).forEach((line, rowOffset) => {
      line.split("\t").forEach((text, columnOffset) => {
        const rowIndex = this.activeCell!.rowIndex + rowOffset;
        const column = columns[startColumnIndex + columnOffset];
        const row = this.options.rows[rowIndex];
        if (row && column && column.editable !== false) this.setCellValue(row, rowIndex, column, text);
      });
    });
    this.render();
  }

  private fillDown() {
    if (!this.activeCell || this.options.enableFillHandle === false) return;
    const column = this.options.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (this.rangeAnchor && this.rangeEnd && column) {
      const minRow = Math.min(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
      const maxRow = Math.max(this.rangeAnchor.rowIndex, this.rangeEnd.rowIndex);
      const sourceRow = this.options.rows[minRow];
      if (!sourceRow || column.editable === false) return;
      const sourceValue = getValue(sourceRow, column);
      for (let rowIndex = minRow + 1; rowIndex <= maxRow; rowIndex += 1) {
        const row = this.options.rows[rowIndex];
        if (row) this.setCellValue(row, rowIndex, column, sourceValue);
      }
      this.render();
      return;
    }
    const row = this.options.rows[this.activeCell.rowIndex];
    const nextRow = this.options.rows[this.activeCell.rowIndex + 1];
    if (!row || !nextRow || !column || column.editable === false) return;
    this.setCellValue(nextRow, this.activeCell.rowIndex + 1, column, getValue(row, column));
    this.render();
  }

  private startColumnResize(event: MouseEvent, column: Column<T>) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = this.columnWidth(column);
    const move = (moveEvent: MouseEvent) => {
      this.columnWidths.set(column.id, Math.max(72, startWidth + moveEvent.clientX - startX));
      this.render();
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  private columnWidth(column: Column<T>) {
    const explicit = this.columnWidths.get(column.id) ?? column.width;
    if (explicit != null) return explicit;
    const contentWidth = this.options.rows
      .slice(0, 100)
      .reduce(
        (max, row) => Math.max(max, estimateWidth(formatValue(row, column, this.options.columns))),
        estimateWidth(column.headerName) + 72,
      );

    return Math.min(column.maxWidth ?? 1000, Math.max(column.minWidth ?? 72, contentWidth));
  }

  private moveRow(rowIndex: number, direction: -1 | 1) {
    const nextIndex = rowIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.options.rows.length) return;
    const previousRows = this.options.rows;
    const rows = [...previousRows];
    const [row] = rows.splice(rowIndex, 1);
    rows.splice(nextIndex, 0, row);
    this.options = { ...this.options, rows };
    this.options.onRowsChange?.({ rows, previousRows, reason: "rowReorder" });
    this.options.onRowOrderChange?.({ rows, movedRow: row, sourceIndex: rowIndex, targetIndex: nextIndex });
    this.render();
  }

  private reorderRow(sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || sourceIndex >= this.options.rows.length || targetIndex >= this.options.rows.length) return;
    const previousRows = this.options.rows;
    const rows = [...previousRows];
    const [row] = rows.splice(sourceIndex, 1);
    rows.splice(targetIndex, 0, row);
    this.options = { ...this.options, rows };
    this.options.onRowsChange?.({ rows, previousRows, reason: "rowReorder" });
    this.options.onRowOrderChange?.({ rows, movedRow: row, sourceIndex, targetIndex });
    this.render();
  }

  private pinnedStyle(column: Column<T>, columns: Column<T>[]) {
    if (!column.pinned) return {};
    const index = columns.findIndex((entry) => entry.id === column.id);
    const width = (entry: Column<T>) => this.columnWidths.get(entry.id) ?? entry.width ?? 150;
    const offset =
      column.pinned === "left"
        ? columns.slice(0, index).filter((entry) => entry.pinned === "left").reduce((sum, entry) => sum + width(entry), 0)
        : columns.slice(index + 1).filter((entry) => entry.pinned === "right").reduce((sum, entry) => sum + width(entry), 0);
    return {
      position: "sticky",
      [column.pinned]: `${offset}px`,
      zIndex: column.pinned === "left" ? "3" : "2",
      background: "#fff",
      boxShadow: column.pinned === "left" ? "inset -1px 0 rgba(30,64,175,.18)" : "inset 1px 0 rgba(30,64,175,.18)",
    } as Partial<CSSStyleDeclaration>;
  }

  private moveColumn(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const order = this.columnOrder.length ? [...this.columnOrder] : this.options.columns.map((column) => column.id);
    const sourceIndex = order.indexOf(sourceId);
    const targetIndex = order.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [source] = order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, source);
    this.columnOrder = order;
    this.options.onColumnOrderChange?.(order);
    this.options.onColumnMoved?.({ columnId: source, sourceIndex, targetIndex, columnIds: order });
    this.render();
  }

  render() {
    const filteredRows = this.visibleRows();
    const pivot = buildPivot(this.options, filteredRows);
    const columns = pivot.columns === this.options.columns ? this.effectiveColumns() : pivot.columns.filter((column) => !column.hidden);
    const rows = this.pageRows(pivot.rows);
    const displayRows =
      pivot.columns === this.options.columns
        ? this.makeDisplayRows(rows)
        : rows.map((row) => ({ kind: "data" as const, row, rowIndex: pivot.rows.indexOf(row) }));
    const root = document.createElement("div");
    root.className = ["gnx-grid", this.options.className]
      .filter(Boolean)
      .join(" ");
    root.dataset.gnxTheme = this.options.theme ?? "dark";
    root.dataset.gnxDensity = this.options.density ?? "standard";
    root.dataset.gnxFillWidth = String(resolveFillWidthOptions(this.options.fillWidth).enabled);
    if (this.options.height != null) {
      root.style.height = typeof this.options.height === "number" ? `${this.options.height}px` : this.options.height;
    }
    const main = document.createElement("div");
    main.className = "gnx-main";
    const toolbar = this.renderToolbar(columns, pivot.rows);
    if (toolbar) main.appendChild(toolbar);
    main.appendChild(this.renderTable(columns, displayRows));
    main.appendChild(this.renderStatus(pivot.rows.length));
    const sidePanel = this.renderSidePanel();
    sidePanel ? root.append(main, sidePanel) : root.appendChild(main);
    if (this.contextMenu) root.appendChild(this.renderContextMenu());
    this.container.replaceChildren(root);
    this.options.onServerSideOperation?.({
      sortModel: this.sortState ? [this.sortState] : [],
      filterModel: this.options.columnFilters,
      advancedFilterModel: this.options.advancedFilterModel,
      selectedRowIds: Array.from(this.selectedIds),
      pageIndex: this.pageIndex,
      pageSize: this.options.pageSize,
      groupBy: this.options.groupBy,
      pivotBy: this.options.pivotBy,
      pivotValueColumns: this.options.pivotValueColumns,
      pivotAggregation: this.options.pivotAggregation,
      treeData: Boolean(this.options.getTreeDataPath),
      masterDetail: Boolean(this.options.masterDetailRenderer),
    });
  }

  private renderToolbar(columns: Column<T>[], rows: T[]) {
    const defaults =
      typeof this.options.toolbar === "object"
        ? {
            summary: false,
            pagination: false,
            quickFilter: false,
            find: false,
            undoRedo: false,
            fillHandle: false,
            fill: false,
            filters: false,
            advancedFilter: false,
            columns: false,
            columnSelector: false,
            exportCsv: false,
            exportExcel: false,
            prevNextPage: false,
            saveAll: false,
            addRow: false,
            deleteRow: false,
            deleteSelectedRows: false,
            ai: false,
          }
        : {
            summary: true,
            pagination: true,
            quickFilter: true,
            find: true,
            undoRedo: true,
            fillHandle: true,
            fill: true,
            filters: true,
            advancedFilter: true,
            columns: true,
            columnSelector: true,
            exportCsv: true,
            exportExcel: true,
            prevNextPage: true,
            saveAll: Boolean(this.options.onSaveAll),
            addRow: false,
            deleteRow: false,
            deleteSelectedRows: false,
            ai: true,
          };
    const raw = { ...defaults, ...(typeof this.options.toolbar === "object" ? this.options.toolbar : {}) };
    const toolbarOptions = {
      ...raw,
      pagination: raw.pagination || raw.prevNextPage,
      fillHandle: raw.fillHandle || raw.fill,
      columns: raw.columns || raw.columnSelector,
    };

    if (this.options.toolbar === false || !Object.values(toolbarOptions).some(Boolean)) return null;

    const toolbar = document.createElement("div");
    toolbar.className = "gnx-toolbar";
    const summary = document.createElement("span");
    summary.textContent = `${rows.length} rows`;
    const actions = document.createElement("div");
    actions.className = "gnx-actions";
    const aiEnabled = this.options.ai?.enabled ?? Boolean(this.options.ai?.provider || this.options.ai?.endpoint);
    if (toolbarOptions.ai && aiEnabled) toolbar.appendChild(this.renderAiCommand());
    const find = document.createElement("input");
    find.className = "gnx-find";
    find.type = "search";
    find.placeholder = "Find cell";
    find.value = this.findText;
    find.addEventListener("input", () => {
      this.findText = find.value;
      this.render();
    });
    const quickFilter = document.createElement("input");
    quickFilter.className = "gnx-find";
    quickFilter.type = "search";
    quickFilter.placeholder = "Quick filter";
    quickFilter.value = this.options.quickFilterText ?? "";
    quickFilter.addEventListener("input", () => {
      this.options = { ...this.options, quickFilterText: quickFilter.value };
      this.pageIndex = 0;
      this.render();
    });
    const pageCount = this.options.pageSize ? Math.max(1, Math.ceil(rows.length / this.options.pageSize)) : 1;
    if (false && toolbarOptions.pagination && this.options.pageSize) {
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
      actions.append(prev, ` Page ${this.pageIndex + 1} of ${pageCount} `, next);
    }
    if (toolbarOptions.quickFilter) actions.appendChild(quickFilter);
    if (toolbarOptions.find) actions.appendChild(find);
    if (toolbarOptions.undoRedo && this.options.enableUndoRedo !== false) {
      const undo = this.button("Undo", () => this.undo());
      undo.disabled = !this.undoStack.length;
      const redo = this.button("Redo", () => this.redo());
      redo.disabled = !this.redoStack.length;
      actions.append(undo, redo);
    }
    if (toolbarOptions.fillHandle && this.options.enableFillHandle !== false) {
      actions.appendChild(this.button("Fill", () => this.fillDown()));
    }
    if (toolbarOptions.addRow) actions.appendChild(this.button("Add row", () => this.addRow()));
    if (toolbarOptions.deleteRow) actions.appendChild(this.button("Delete row", () => this.deleteRow(this.activeCell?.rowIndex ?? 0)));
    if (toolbarOptions.deleteSelectedRows) actions.appendChild(this.button("Delete selected", () => this.deleteSelectedRows()));
    if (toolbarOptions.saveAll) actions.appendChild(this.button("Save all", () => this.saveAll()));
    if (toolbarOptions.exportCsv) actions.appendChild(this.button("Export CSV", () => this.exportCsv(columns, rows)));
    if (toolbarOptions.exportExcel) actions.appendChild(this.button("Export Excel", () => this.exportExcel(columns, rows)));
    if (toolbarOptions.summary) toolbar.appendChild(summary);
    toolbar.appendChild(actions);
    return toolbar;
  }

  private createAiRequest(prompt: string): GridNexaAiRequest {
    return {
      prompt,
      state: {
        columns: this.options.columns.map((column) => ({
          id: column.id,
          field: String(column.field),
          headerName: column.headerName,
          type: typeof column.filter === "string" ? column.filter : column.filter?.type,
          hidden: this.hiddenColumnIds.has(column.id) || column.hidden,
          pinned: column.pinned,
        })),
        rowCount: this.options.rows.length,
        sampleRows: this.options.rows.slice(0, this.options.ai?.sampleRowCount ?? 8).map((row) =>
          Object.fromEntries(this.options.columns.map((column) => [String(column.field), getResolvedValue(row, column, this.options.columns)])),
        ),
        quickFilterText: this.options.quickFilterText,
        groupBy: this.options.groupBy,
        pivotBy: this.options.pivotBy,
        pivotValueColumns: this.options.pivotValueColumns as string[] | undefined,
        pivotAggregation: this.options.pivotAggregation,
        activeColumnFilters: this.options.columnFilters,
        advancedFilterModel: this.options.advancedFilterModel,
      },
    };
  }

  private resolveColumn(idOrField?: string | null) {
    return idOrField ? this.options.columns.find((column) => column.id === idOrField || column.field === idOrField) : undefined;
  }

  private applyAiAction(action: GridNexaCommandAction) {
    if (action.type === "quickFilter") {
      this.options = { ...this.options, quickFilterText: action.value };
      this.pageIndex = 0;
    } else if (action.type === "setColumnFilter") {
      const column = this.resolveColumn(action.columnId);
      if (column) {
        const filters = { ...(this.options.columnFilters ?? {}) };
        action.filter ? (filters[column.id] = action.filter) : delete filters[column.id];
        this.options = { ...this.options, columnFilters: filters };
      }
    } else if (action.type === "setAdvancedFilter") {
      this.options = { ...this.options, advancedFilterModel: action.model };
      this.options.onAdvancedFilterModelChange?.(action.model);
    } else if (action.type === "sort") {
      const column = this.resolveColumn(action.columnId);
      this.sortState = column && action.direction ? { columnId: column.id, direction: action.direction } : null;
    } else if (action.type === "group") {
      const column = this.resolveColumn(action.columnId);
      this.setPivot({ groupBy: column ? (column.field as keyof T & string) : undefined });
      return;
    } else if (action.type === "pivot") {
      const groupColumn = this.resolveColumn(action.groupBy);
      const pivotColumn = this.resolveColumn(action.pivotBy);
      const valueColumns = (action.valueColumns ?? [])
        .map((columnId) => this.resolveColumn(columnId)?.field as keyof T & string | undefined)
        .filter((field): field is keyof T & string => Boolean(field));
      this.setPivot({
        groupBy: action.groupBy === null ? undefined : groupColumn?.field as keyof T & string | undefined,
        pivotBy: action.pivotBy === null ? undefined : pivotColumn?.field as keyof T & string | undefined,
        pivotValueColumns: valueColumns.length ? valueColumns : this.options.pivotValueColumns,
        pivotAggregation: action.aggregation ?? this.options.pivotAggregation,
      });
      return;
    } else if (action.type === "pinColumn") {
      const column = this.resolveColumn(action.columnId);
      if (column) column.pinned = action.pinned ?? undefined;
    } else if (action.type === "hideColumn") {
      const column = this.resolveColumn(action.columnId);
      if (column) action.hidden ? this.hiddenColumnIds.add(column.id) : this.hiddenColumnIds.delete(column.id);
    } else if (action.type === "export") {
      action.format === "excel" ? this.exportExcel(this.effectiveColumns(), this.visibleRows()) : this.exportCsv(this.effectiveColumns(), this.visibleRows());
    }
    this.render();
  }

  private applyAiPlan(plan: GridNexaCommandPlan) {
    plan.actions.forEach((action) => this.applyAiAction(action));
    this.options.ai?.onApply?.(plan);
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
      const result = this.options.ai?.provider
        ? await this.options.ai.provider(request)
        : this.options.ai?.endpoint
          ? await (await (this.options.ai.fetcher ?? fetch)(this.options.ai.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request),
            })).json()
          : null;
      const plan = result && "plan" in result ? result.plan : result as GridNexaCommandPlan;
      if (!plan?.actions?.length) throw new Error("AI did not return any grid actions.");
      this.aiPlan = plan;
      this.options.ai?.onPlan?.(plan);
      if (this.options.ai?.autoApply) this.applyAiPlan(plan);
    } catch (error) {
      this.aiError = error instanceof Error ? error.message : "AI request failed";
      this.options.ai?.onError?.(error);
    } finally {
      this.aiBusy = false;
      this.render();
    }
  }

  private renderAiCommand() {
    const shell = document.createElement("div");
    shell.className = "gnx-rule";
    const input = document.createElement("input");
    input.placeholder = this.options.ai?.placeholder ?? "Ask AI to filter, sort, group, pivot, pin, or export";
    input.value = this.aiPrompt;
    input.addEventListener("input", () => {
      this.aiPrompt = input.value;
    });
    const ask = this.button(this.aiBusy ? "Thinking" : "Ask AI", () => void this.requestAiPlan());
    ask.disabled = this.aiBusy;
    shell.append(input, ask);
    if (this.aiError) shell.append(` ${this.aiError}`);
    if (this.aiPlan) {
      const apply = this.button(`Apply ${this.aiPlan.actions.length} actions`, () => this.applyAiPlan(this.aiPlan!));
      const dismiss = this.button("Dismiss", () => {
        this.aiPlan = null;
        this.render();
      });
      shell.append(` ${this.aiPlan.title} `, dismiss, apply);
    }
    return shell;
  }

  private renderTable(columns: Column<T>[], rows: Array<DisplayRow<T>>) {
    const fillWidth = resolveFillWidthOptions(this.options.fillWidth);
    const flexColumns = columns.filter((entry) => (entry.flex ?? 0) > 0);
    const table = document.createElement("table");
    table.className = "gnx-table";
    const thead = document.createElement("thead");
    const leading = Number(this.options.checkboxSelection) + Number(this.options.rowNumbers);
    if (this.options.mergedHeaders?.length) thead.appendChild(this.renderMergedHeaders(columns, leading));
    const header = document.createElement("tr");
    if (this.options.checkboxSelection) header.appendChild(cell("", "th")).className = "gnx-control";
    if (this.options.rowNumbers) header.appendChild(cell("#", "th")).className = "gnx-control";
    columns.forEach((column, columnIndex) => {
      const tools = resolveToolOptions(this.options, column);
      const th = cell(column.headerName, "th");
      th.className = classNameList(
        this.options.classNames?.headerCell,
        typeof column.headerClassName === "function"
          ? column.headerClassName({ column })
          : column.headerClassName,
        this.options.getHeaderClassName?.({ column, columnIndex }),
      );
      const shouldFill =
        fillWidth.enabled &&
        ((column.flex ?? 0) > 0 ||
          ((fillWidth.mode === "lastColumn" ||
            (fillWidth.mode === "flexOrLast" && flexColumns.length === 0)) &&
            columnIndex === columns.length - 1));
      th.style.width = shouldFill ? "auto" : `${this.columnWidth(column)}px`;
      th.style.minWidth = `${this.columnWidth(column)}px`;
      Object.assign(th.style, this.pinnedStyle(column, columns));
      th.draggable = Boolean(tools.menu);
      th.addEventListener("dragstart", () => {
        this.draggedColumnId = column.id;
      });
      th.addEventListener("dragover", (event) => {
        event.preventDefault();
        th.classList.add("gnx-drop-target");
      });
      th.addEventListener("dragleave", () => th.classList.remove("gnx-drop-target"));
      th.addEventListener("drop", (event) => {
        event.preventDefault();
        th.classList.remove("gnx-drop-target");
        if (this.draggedColumnId) this.moveColumn(this.draggedColumnId, column.id);
        this.draggedColumnId = null;
      });
      th.addEventListener("click", () => {
        if (!tools.sort || column.sortable === false) return;
        this.sortState = this.sortState?.columnId !== column.id ? { columnId: column.id, direction: "asc" } : this.sortState.direction === "asc" ? { columnId: column.id, direction: "desc" } : null;
        const model = this.sortState ? [this.sortState] : [];
        this.options.onSortModelChange?.(model);
        this.options.onSortChanged?.(model);
        this.render();
      });
      if (tools.resize && column.resizable !== false) {
        const resizer = document.createElement("span");
        resizer.className = "gnx-resizer";
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
        this.appendDataRow(tbody, entry.row, entry.rowIndex, columns, leading, entry);
        const rowId = this.getRowId(entry.row, entry.rowIndex);
        if (this.options.masterDetailRenderer && this.expandedDetailIds.has(rowId)) {
          this.appendDetailRow(tbody, entry.row, columns.length + leading);
        }
      }
    });
    table.appendChild(tbody);
    return table;
  }

  private renderStatus(totalRows: number) {
    const footer = this.options.footer;
    if (footer === false) return document.createDocumentFragment();
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
    status.className = "gnx-status";
    const state = {
      rowCountLabel: `${totalRows} rows`,
      selectedRowsLabel: `${this.selectedIds.size} selected`,
      activeCellLabel: this.activeCell ? `Cell ${this.activeCell.rowIndex + 1}:${this.activeCell.columnId}` : "No cell",
      selectedRangeLabel: this.rangeAnchor && this.rangeEnd ? "Range selected" : "No range",
      filterCountLabel: `${Object.keys(this.options.columnFilters ?? {}).length + Number(isAdvancedActive(this.options.advancedFilterModel))} filters`,
      sortStatusLabel: this.sortState ? `Sorted ${this.sortState.direction}` : "Unsorted",
      pageIndex: this.pageIndex,
      pageCount: this.options.pageSize ? Math.max(1, Math.ceil(totalRows / this.options.pageSize)) : 1,
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
    if (footerOptions.filterCount) status.append(state.filterCountLabel);
    if (footerOptions.selectedRange) status.append(state.selectedRangeLabel);
    const toolbar = this.options.toolbar;
    const paginationEnabled =
      toolbar === undefined ||
      toolbar === true ||
      (typeof toolbar === "object" &&
        Boolean((toolbar as Record<string, boolean>).pagination || (toolbar as Record<string, boolean>).prevNextPage));
    if (footerOptions.pagination && paginationEnabled && this.options.pageSize) {
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

  private renderMergedHeaders(columns: Column<T>[], leading: number) {
    const row = document.createElement("tr");
    if (leading) {
      const spacer = cell("", "th");
      spacer.colSpan = leading;
      row.appendChild(spacer);
    }
    (this.options.mergedHeaders as MergedHeader[]).forEach((header) => {
      const count = header.columnIds.filter((columnId) => columns.some((column) => column.id === columnId)).length;
      if (!count) return;
      const th = cell(header.headerName, "th");
      th.colSpan = count;
      row.appendChild(th);
    });
    return row;
  }

  private appendGroupRow(tbody: HTMLTableSectionElement, entry: Extract<DisplayRow<T>, { kind: "group" }>, colSpan: number) {
    const tr = document.createElement("tr");
    tr.className = "gnx-group-row";
    const td = document.createElement("td");
    td.colSpan = colSpan;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "gnx-tree-toggle";
    toggle.textContent = this.collapsedGroups.has(entry.key) ? "+" : "-";
    toggle.addEventListener("click", () => {
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
    detail.className = "gnx-detail";
    detail.colSpan = colSpan;
    const content = this.options.masterDetailRenderer?.(row);
    content instanceof Node ? detail.appendChild(content) : detail.textContent = String(content ?? "");
    detailRow.appendChild(detail);
    tbody.appendChild(detailRow);
  }

  private appendDataRow(tbody: HTMLTableSectionElement, row: T, rowIndex: number, columns: Column<T>[], leading: number, display?: Extract<DisplayRow<T>, { kind: "data" }>) {
    const tr = document.createElement("tr");
    const rowSelected = this.selectedIds.has(this.getRowId(row, rowIndex));
    tr.className = classNameList(
      this.options.classNames?.row,
      this.options.getRowClassName?.({ row, rowIndex, selected: rowSelected }),
    );
    tr.draggable = Boolean(this.options.enableRowReorder);
    tr.addEventListener("dragstart", () => {
      if (!this.options.enableRowReorder) return;
      this.draggedRowIndex = rowIndex;
    });
    tr.addEventListener("dragover", (event) => {
      if (this.options.enableRowReorder) event.preventDefault();
    });
    tr.addEventListener("drop", (event) => {
      if (!this.options.enableRowReorder) return;
      event.preventDefault();
      if (this.draggedRowIndex != null) this.reorderRow(this.draggedRowIndex, rowIndex);
      this.draggedRowIndex = null;
    });
    const rowId = this.getRowId(row, rowIndex);
    if (this.options.checkboxSelection) {
      const td = document.createElement("td");
      td.className = "gnx-control";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.selectedIds.has(rowId);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.selectedIds.add(rowId) : this.selectedIds.delete(rowId);
        const selectedRows = this.options.rows.filter((entry, index) => this.selectedIds.has(this.getRowId(entry, index)));
        this.options.onRowSelectionChange?.(selectedRows);
        this.options.onSelectionChanged?.({ selectedRows, selectedRowIds: Array.from(this.selectedIds) });
        this.options.onRowSelected?.({ row, rowIndex, selected: checkbox.checked, selectedRows });
      });
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    if (this.options.rowNumbers) {
      const rowNumber = cell(String(rowIndex + 1));
      rowNumber.className = "gnx-control";
      if (this.options.enableRowReorder) {
      const tools = document.createElement("span");
      tools.className = "gnx-row-tools";
      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "↑";
      up.disabled = rowIndex <= 0;
      up.addEventListener("click", (event) => {
        event.stopPropagation();
        this.moveRow(rowIndex, -1);
      });
      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.disabled = rowIndex >= this.options.rows.length - 1;
      down.addEventListener("click", (event) => {
        event.stopPropagation();
        this.moveRow(rowIndex, 1);
      });
      tools.append(up, down);
      rowNumber.append(" ", tools);
      }
      tr.appendChild(rowNumber);
    }
    columns.forEach((column, columnIndex) => {
      const cellValue = getResolvedValue(row, column, this.options.columns);
      const td = cell(formatValue(row, column, this.options.columns));
      const textDisplay = resolveTextDisplay(this.options, column);
      td.className = classNameList(
        `gnx-cell-${textDisplay.overflow ?? "ellipsis"}`,
        this.options.classNames?.cell,
        resolveClassName(column.className, { value: cellValue, row, rowIndex, column }),
        resolveClassName(column.cellClassName, { value: cellValue, row, rowIndex, column }),
        this.options.getCellClassName?.({
          value: cellValue,
          row,
          rowIndex,
          column,
          columnIndex,
          selected: rowSelected,
        }),
      );
      td.style.width = `${this.columnWidth(column)}px`;
      if (textDisplay.overflow === "ellipsis" && textDisplay.showTooltip !== false) {
        td.title = formatValue(row, column, this.options.columns);
      }
      Object.assign(td.style, this.pinnedStyle(column, columns));
      if (this.activeCell?.rowIndex === rowIndex && this.activeCell.columnId === column.id) {
        td.classList.add("gnx-cell-active");
      }
      if (this.isCellInRange(rowIndex, column.id, columns)) td.classList.add("gnx-cell-range");
      if (this.options.getTreeDataPath && columnIndex === 0) {
        const depth = display?.depth ?? Math.max(0, this.options.getTreeDataPath(row).length - 1);
        td.style.paddingLeft = `${12 + depth * 24}px`;
        if (display?.hasChildren && display.treeKey) {
          const treeKey = display.treeKey;
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "gnx-tree-toggle";
          toggle.textContent = this.collapsedTreeKeys.has(treeKey) ? "+" : "-";
          toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            this.collapsedTreeKeys.has(treeKey) ? this.collapsedTreeKeys.delete(treeKey) : this.collapsedTreeKeys.add(treeKey);
            this.render();
          });
          td.prepend(toggle);
        }
      } else if (this.options.masterDetailRenderer && columnIndex === 0) {
        const rowId = this.getRowId(row, rowIndex);
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "gnx-detail-toggle";
        toggle.textContent = this.expandedDetailIds.has(rowId) ? "-" : "+";
        toggle.addEventListener("click", (event) => {
          event.stopPropagation();
          this.expandedDetailIds.has(rowId) ? this.expandedDetailIds.delete(rowId) : this.expandedDetailIds.add(rowId);
          this.render();
        });
        td.prepend(toggle);
      }
      if (this.findText && formatValue(row, column, this.options.columns).toLowerCase().includes(this.findText.toLowerCase())) {
        td.classList.add("gnx-cell-active");
      }
      td.addEventListener("click", (event) => {
        this.activeCell = { rowIndex, columnId: column.id };
        if (event.shiftKey && this.rangeAnchor) {
          this.rangeEnd = { rowIndex, columnId: column.id };
        } else {
          this.rangeAnchor = { rowIndex, columnId: column.id };
          this.rangeEnd = { rowIndex, columnId: column.id };
        }
        this.options.onRowClick?.({ row, rowIndex });
        this.options.onSelectedRowChange?.({ row, rowIndex, selectedRows: this.options.rows.filter((entry, index) => this.selectedIds.has(this.getRowId(entry, index))) });
        this.options.onCellClick?.({ row, rowIndex, column, columnIndex, value: cellValue });
        this.render();
      });
      td.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        this.activeCell = { rowIndex, columnId: column.id };
        this.contextMenu = { x: event.clientX, y: event.clientY, rowIndex, columnId: column.id };
        this.render();
      });
      td.addEventListener("dblclick", () => {
        this.options.onRowDoubleClick?.({ row, rowIndex });
        this.options.onCellDoubleClick?.({ row, rowIndex, column, columnIndex, value: cellValue });
        if (column.editable) this.editCell(td, row, rowIndex, column);
      });
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  private editCell(td: HTMLTableCellElement, row: T, rowIndex: number, column: Column<T>) {
    const oldValue = getValue(row, column);
    const input = this.createEditor(column, oldValue);
    td.replaceChildren(input);
    input.focus();
    const commit = () => {
      this.setCellValue(row, rowIndex, column, input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value);
      this.render();
    };
    input.addEventListener("blur", commit, { once: true });
    input.addEventListener("keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === "Enter") input.blur();
      if (key === "Escape") this.render();
    });
  }

  private createEditor(column: Column<T>, value: unknown) {
    const editor = column.editor;
    if (editor === "checkbox") {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(value);
      return input;
    }
    if (editor === "date") {
      const input = document.createElement("input");
      input.type = "date";
      input.value = String(value ?? "");
      return input;
    }
    if (editor === "number") {
      const input = document.createElement("input");
      input.type = "number";
      input.value = String(value ?? "");
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
      select.value = String(value ?? "");
      return select;
    }
    const input = document.createElement("input");
    input.value = String(value ?? "");
    return input;
  }

  private renderContextMenu() {
    const menu = document.createElement("div");
    menu.className = "gnx-context";
    menu.style.left = `${this.contextMenu?.x ?? 0}px`;
    menu.style.top = `${this.contextMenu?.y ?? 0}px`;
    menu.addEventListener("click", (event) => event.stopPropagation());
    const row = this.contextMenu ? this.options.rows[this.contextMenu.rowIndex] : undefined;
    const column = this.options.columns.find((entry) => entry.id === this.contextMenu?.columnId);
    const action = (label: string, run: () => void | Promise<void>) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        void run();
        this.contextMenu = null;
      });
      return button;
    };
    menu.append(
      action("Copy", () => this.copyActiveCell()),
      action("Paste", () => this.pasteActiveCell()),
      action("Edit cell", () => {
        if (!row || !column || column.editable === false || !this.contextMenu) return;
        const nextValue = window.prompt(`Edit ${column.headerName}`, String(getValue(row, column) ?? ""));
        if (nextValue != null) {
          this.setCellValue(row, this.contextMenu.rowIndex, column, nextValue);
          this.render();
        }
      }),
      action("Clear cell", () => {
        if (row && column && column.editable !== false && this.contextMenu) {
          this.setCellValue(row, this.contextMenu.rowIndex, column, "");
          this.render();
        }
      }),
    );
    if (column && resolveToolOptions(this.options, column).hide) {
      menu.appendChild(
        action("Hide column", () => {
          this.hiddenColumnIds.add(column.id);
          this.render();
        }),
      );
    }
    return menu;
  }

  private renderSidePanel() {
    const sidePanel = resolveSidePanelOptions(this.options.sidePanel);

    if (!sidePanel.enabled) return null;

    const columnTabVisible = sidePanel.columns || sidePanel.pivot;
    const side = document.createElement("aside");
    side.className = "gnx-side";
    const tabs = document.createElement("div");
    tabs.className = "gnx-tabs";

    if (columnTabVisible) {
      const tab = document.createElement("button");
      tab.className = `gnx-tab${this.sideOpen === "columns" ? " active" : ""}`;
      tab.type = "button";
      tab.textContent = sidePanel.columns ? "Columns" : "Pivot";
      tab.addEventListener("click", () => {
        this.sideOpen = this.sideOpen === "columns" ? null : "columns";
        this.render();
      });
      tabs.appendChild(tab);
    }

    if (sidePanel.filters) {
      const tab = document.createElement("button");
      tab.className = `gnx-tab${this.sideOpen === "filters" ? " active" : ""}`;
      tab.type = "button";
      tab.textContent = "Filters";
      tab.addEventListener("click", () => {
        this.sideOpen = this.sideOpen === "filters" ? null : "filters";
        this.render();
      });
      tabs.appendChild(tab);
    }

    side.appendChild(tabs);
    if (!this.sideOpen) return side;
    const panel = document.createElement("div");
    panel.className = "gnx-panel";

    if (this.sideOpen === "columns") {
      if (sidePanel.columns) panel.appendChild(this.renderColumnPanel());
      if (sidePanel.pivot) panel.appendChild(this.renderPivotPanel());
    }

    if (this.sideOpen === "filters" && sidePanel.filters) {
      panel.appendChild(this.renderAdvancedPanel());
    }

    side.appendChild(panel);
    return side;
  }

  private renderColumnPanel() {
    const section = document.createElement("div");
    section.className = "gnx-section";
    const title = document.createElement("h3");
    title.textContent = "Columns";
    section.appendChild(title);
    this.options.columns.forEach((column) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !this.hiddenColumnIds.has(column.id);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.hiddenColumnIds.delete(column.id) : this.hiddenColumnIds.add(column.id);
        this.render();
      });
      label.append(checkbox, column.headerName);
      section.appendChild(label);
    });
    return section;
  }

  private renderPivotPanel() {
    const section = document.createElement("div");
    section.className = "gnx-section";
    const title = document.createElement("h3");
    title.textContent = "Pivot Mode";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = Boolean(this.options.pivotBy);
    toggle.addEventListener("change", () => {
      const numeric = this.options.columns.find((column) => this.options.rows.some((row) => typeof getValue(row, column) === "number"));
      toggle.checked
        ? this.setPivot({
            pivotBy: this.options.pivotBy ?? (this.options.columns[0]?.field as keyof T & string),
            groupBy: this.options.groupBy ?? (this.options.columns[1]?.field as keyof T & string),
            pivotValueColumns: this.options.pivotValueColumns?.length ? this.options.pivotValueColumns : numeric ? [numeric.field as keyof T & string] : [],
          })
        : this.setPivot({ pivotBy: undefined, groupBy: undefined, pivotValueColumns: [] });
    });
    const label = document.createElement("label");
    label.append(toggle, " Pivot Mode");
    section.append(title, label, this.select("Row Groups", this.options.groupBy, "No row group", (value) => this.setPivot({ groupBy: value as keyof T & string | undefined })), this.select("Pivot Columns", this.options.pivotBy, "Pivot off", (value) => this.setPivot({ pivotBy: value as keyof T & string | undefined })));
    const aggregation = this.select("Aggregation", this.options.pivotAggregation ?? "sum", "", (value) => this.setPivot({ pivotAggregation: value as PivotAggregation }), ["sum", "avg", "count", "min", "max"]);
    section.appendChild(aggregation);
    return section;
  }

  private renderAdvancedPanel() {
    const section = document.createElement("div");
    section.className = "gnx-section";
    const title = document.createElement("h3");
    title.textContent = "Advanced Filter";
    const rule = document.createElement("div");
    rule.className = "gnx-rule";
    const column = this.select("", this.options.columns[0]?.id, "", () => undefined, this.options.columns.map((entry) => entry.id));
    const operator = this.select("", "contains", "", () => undefined, ["contains", "equals", "gt", "gte", "lt", "lte", "blank", "notBlank"]);
    const value = document.createElement("input");
    value.placeholder = "Value";
    const apply = this.button("Apply rule", () => {
      const columnSelect = column.querySelector("select") as HTMLSelectElement;
      const operatorSelect = operator.querySelector("select") as HTMLSelectElement;
      const model: AdvancedFilterModel = { kind: "group", joinOperator: "and", conditions: [{ kind: "rule", columnId: columnSelect.value, operator: operatorSelect.value as ColumnFilterModel["operator"], value: value.value }] };
      this.options = { ...this.options, advancedFilterModel: model };
      this.options.onAdvancedFilterModelChange?.(model);
      this.render();
    });
    const clear = this.button("Clear", () => {
      this.options = { ...this.options, advancedFilterModel: null };
      this.options.onAdvancedFilterModelChange?.(null);
      this.render();
    });
    rule.append(column, operator, value, apply, clear);
    section.append(title, rule);
    return section;
  }

  private select(labelText: string, value: string | undefined, emptyLabel: string, onChange: (value: string | undefined) => void, fixedOptions?: string[]) {
    const label = document.createElement("label");
    if (labelText) label.append(`${labelText} `);
    const select = document.createElement("select");
    if (emptyLabel) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = emptyLabel;
      select.appendChild(empty);
    }
    (fixedOptions ?? this.options.columns.map((column) => String(column.field))).forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = this.options.columns.find((column) => column.id === item || column.field === item)?.headerName ?? item;
      select.appendChild(option);
    });
    select.value = value ?? "";
    select.addEventListener("change", () => onChange(select.value || undefined));
    label.appendChild(select);
    return label;
  }

  private button(text: string, onClick: () => void) {
    const button = document.createElement("button");
    button.className = "gnx-button";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }
}

export function createGridNexa<T = Record<string, unknown>>(container: HTMLElement, options: GridNexaJavaScriptOptions<T>) {
  return new GridNexaGrid(container, options);
}
