import "../../react/src/styles/gridnexa.css";

import {
  GRIDNEXA_DEFAULT_VIEW_ID,
  getGridNexaValidationMessage,
  readGridNexaSavedViews,
  resolveGridNexaEnabled,
  resolveGridNexaSavedViews,
  resolveGridNexaValidation,
  shouldShowGridNexaDiagnostics,
  writeGridNexaSavedViews,
  type GridNexaDomChangeEntry,
  type GridNexaDomSavedView,
} from "@gridnexa/core";
import type {
  AdvancedFilterModel,
  Column,
  ColumnFilterModel,
  GridOptions,
  GridNexaApi,
  GridNexaClassName,
  GridNexaColumnToolOptions,
  GridNexaFillWidthOptions,
  GridNexaPreset,
  GridNexaSidePanelOptions,
  GridNexaStateStorageOptions,
  GridNexaSummaryOptions,
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
  summaries?: GridNexaSummaryOptions;
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
type PersistedGridState = {
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  hiddenColumnIds?: string[];
  pinnedColumnIds?: Record<string, "left" | "right" | undefined>;
  sortModel?: SortState;
  filterModel?: Record<string, ColumnFilterModel>;
  pageIndex?: number;
  sidePanel?: "columns" | "filters" | null;
};
type DomViewState = PersistedGridState;
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
    .gnx-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:0;width:100%;min-width:0;border:1px solid var(--gnx-border);border-radius:12px;background:var(--gnx-bg);color:var(--gnx-text);font:14px/1.45 Inter,"Segoe UI",system-ui,sans-serif;overflow:hidden;box-shadow:var(--gnx-shadow);--gnx-bg:#fff;--gnx-panel:#fff;--gnx-panel-strong:#f8fafc;--gnx-text:#0f172a;--gnx-muted:#64748b;--gnx-heading:#111827;--gnx-header-bg:#f8fbff;--gnx-border:rgba(30,64,175,.16);--gnx-row-hover:rgba(37,99,235,.07);--gnx-primary:#2563eb;--gnx-shadow:0 18px 48px rgba(15,23,42,.12);--gnx-row-height:42px;--gnx-cell-pad:12px}
    .gnx-grid[data-gnx-theme=dark]{--gnx-bg:#070b18;--gnx-panel:#0f172a;--gnx-panel-strong:#111827;--gnx-text:#e5edf7;--gnx-muted:#9ca3af;--gnx-heading:#f8fafc;--gnx-header-bg:#0b1220;--gnx-border:rgba(148,163,184,.2);--gnx-row-hover:rgba(96,165,250,.12);--gnx-primary:#60a5fa;--gnx-shadow:0 24px 70px rgba(4,8,20,.38)}
    .gnx-grid[data-gnx-density=compact]{--gnx-row-height:34px;--gnx-cell-pad:8px}.gnx-grid[data-gnx-density=comfortable]{--gnx-row-height:50px;--gnx-cell-pad:16px}
    .gnx-grid,.gnx-grid *{box-sizing:border-box}.gnx-main{position:relative;display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-width:0;overflow:hidden}.gnx-main .sg-grid-root{position:relative;width:100%;min-width:0;max-height:100%;overflow:auto;border:1px solid var(--gnx-border);border-radius:14px;background:var(--gnx-bg);box-shadow:var(--gnx-shadow);outline:none}.gnx-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border-bottom:1px solid var(--gnx-border);background:var(--gnx-panel)}.gnx-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
    .gnx-button,.gnx-panel button{min-height:32px;padding:0 10px;border:1px solid var(--gnx-border);border-radius:8px;background:var(--gnx-panel);color:var(--gnx-primary);font:inherit;font-weight:800;cursor:pointer}.gnx-button:disabled{opacity:.48;cursor:not-allowed}
    .gnx-table{width:max-content;min-width:max-content;table-layout:fixed;border:0;border-radius:0;background:transparent;box-shadow:none;border-collapse:separate;border-spacing:0}.gnx-grid[data-gnx-fill-width=true] .gnx-table{width:100%;min-width:100%}.gnx-table th,.gnx-table td{min-height:var(--gnx-row-height);height:var(--gnx-row-height);padding:0 var(--gnx-cell-pad);border-right:1px solid var(--gnx-border);border-bottom:1px solid var(--gnx-border);text-align:left;white-space:nowrap}
    .gnx-table th{position:relative;top:auto;z-index:1;height:44px;min-height:44px;padding:0 14px;background:var(--gnx-header-bg);color:var(--gnx-heading);font-size:.78rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase;overflow:hidden;cursor:pointer;user-select:none}.gnx-table th[draggable=true]{cursor:grab}.gnx-table thead tr:first-child th{background:var(--gnx-header-bg);color:var(--gnx-heading);text-align:left}.gnx-table tbody tr:hover td{background:var(--gnx-row-hover)}.gnx-table .sg-header-content{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:100%;min-width:0}.gnx-table .sg-header-main{display:inline-flex;align-items:center;gap:8px;min-width:0}.gnx-table .sg-header-label{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gnx-table .sg-header-actions{display:inline-flex;flex:0 0 auto;align-items:center;gap:4px}.gnx-table .sg-header-icon-button{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--gnx-muted);cursor:pointer}.gnx-table .sg-header-icon-button:hover{background:var(--gnx-row-hover);color:var(--gnx-primary)}.gnx-table .sg-column-drag-handle{flex:0 0 auto;width:10px;height:18px;border-radius:4px;opacity:.72;background-image:radial-gradient(currentColor 1px,transparent 1.5px);background-size:5px 5px;color:var(--gnx-muted);cursor:grab}.gnx-table .sg-resize-handle{position:absolute;top:0;right:0;width:10px;height:100%;margin:0;border-right:2px solid color-mix(in srgb,var(--gnx-primary) 28%,transparent);cursor:col-resize}.gnx-table .sg-selection-cell,.gnx-table .sg-selection-header{width:44px;min-width:44px;max-width:44px;padding:0;text-align:center}.gnx-table .sg-row-number,.gnx-table .sg-row-number-header{width:72px;min-width:72px;max-width:72px;padding:0;text-align:center}.gnx-table .sg-row-number{position:relative;padding-right:30px}
    .gnx-cell-ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gnx-cell-clip{white-space:nowrap;overflow:hidden;text-overflow:clip}.gnx-cell-wrap{white-space:normal;overflow-wrap:anywhere;text-overflow:clip}
    .gnx-control{width:44px;text-align:center!important}.gnx-detail{background:var(--gnx-panel-strong);color:var(--gnx-text)}.gnx-empty{padding:18px;color:var(--gnx-muted)}.gnx-status{display:flex;gap:18px;flex-wrap:wrap;padding:10px 12px;border-top:1px solid var(--gnx-border);font-size:12px;font-weight:800;color:var(--gnx-muted);background:var(--gnx-panel)}.gnx-find{min-height:32px;padding:0 9px;border:1px solid var(--gnx-border);border-radius:8px;background:var(--gnx-panel-strong);color:var(--gnx-text)}.gnx-cell-active{outline:2px solid var(--gnx-primary);outline-offset:-2px;background:color-mix(in srgb,var(--gnx-primary) 12%,transparent)!important}.gnx-cell-range{background:color-mix(in srgb,var(--gnx-primary) 16%,transparent)!important}.gnx-row-tools{position:absolute;top:50%;right:4px;display:inline-flex;gap:2px;opacity:0;pointer-events:none;transform:translateY(-50%);transition:opacity .12s ease}.sg-row:hover .gnx-row-tools,.sg-row-number:focus-within .gnx-row-tools{opacity:1;pointer-events:auto}.gnx-row-tools button{width:22px;min-height:22px;padding:0;border:1px solid var(--gnx-border);border-radius:6px;background:var(--gnx-panel);color:var(--gnx-primary);font-weight:900}.gnx-drop-target{box-shadow:inset 3px 0 var(--gnx-primary)}.gnx-resizer{float:right;width:7px;height:24px;cursor:col-resize;border-right:2px solid var(--gnx-border)}.gnx-group-row td{background:var(--gnx-panel-strong)!important;color:var(--gnx-heading);font-weight:900;text-transform:uppercase;letter-spacing:.04em}.gnx-tree-toggle,.gnx-detail-toggle{min-height:24px;margin-right:6px;border:1px solid var(--gnx-border);border-radius:6px;background:var(--gnx-panel);color:var(--gnx-primary);font-weight:900}.gnx-context{position:fixed;z-index:9999;display:grid;min-width:150px;padding:6px;border:1px solid var(--gnx-border);border-radius:10px;background:var(--gnx-panel);box-shadow:var(--gnx-shadow)}.gnx-context button{min-height:30px;border:0;background:transparent;text-align:left;color:var(--gnx-text);font:inherit}.gnx-context button:hover{background:var(--gnx-row-hover)}
    .gnx-side{position:relative;z-index:2;display:flex;min-width:42px;border-left:1px solid var(--gnx-border);background:var(--gnx-panel);overflow:hidden}.gnx-tabs{display:grid;grid-auto-rows:116px;width:42px;background:var(--gnx-panel-strong)}.gnx-tab{border:0;border-bottom:1px solid var(--gnx-border);background:transparent;color:var(--gnx-muted);cursor:pointer;touch-action:manipulation;font:inherit;font-weight:800;writing-mode:vertical-rl}.gnx-tab.active,.gnx-tab:hover{background:var(--gnx-row-hover);color:var(--gnx-primary)}
    .gnx-panel{width:min(340px,calc(100vw - 64px));max-height:620px;overflow:auto;padding:14px;background:var(--gnx-panel);color:var(--gnx-text);box-shadow:-18px 0 42px rgba(15,23,42,.1)}.gnx-panel h3{margin:0 0 8px;font-size:14px}.gnx-section{display:grid;gap:8px;padding:12px 0;border-top:1px solid var(--gnx-border)}.gnx-panel label{display:flex;align-items:center;gap:8px;min-height:30px}.gnx-panel select,.gnx-panel input{min-height:34px;padding:0 9px;border:1px solid var(--gnx-border);border-radius:8px;background:var(--gnx-panel);color:var(--gnx-text)}.gnx-rule{display:grid;gap:8px;padding:10px;border:1px solid var(--gnx-border);border-radius:10px;background:var(--gnx-panel-strong)}.gnx-overlay{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb,var(--gnx-bg) 78%,transparent);backdrop-filter:blur(3px);pointer-events:none}.gnx-overlay-card{max-width:min(420px,calc(100% - 32px));padding:18px 20px;border:1px solid var(--gnx-border);border-radius:14px;background:var(--gnx-panel);color:var(--gnx-heading);box-shadow:var(--gnx-shadow);font-weight:800;text-align:center}.gnx-overlay-card[data-kind=error]{border-color:rgba(220,38,38,.24);color:#991b1b}
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

function buildSummaryLabel(values: unknown[], emptyLabel: string) {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (!numbers.length) return emptyLabel;
  const sum = numbers.reduce((total, value) => total + value, 0);
  const average = sum / numbers.length;
  const formatNumber = (value: number) =>
    Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `Count ${numbers.length} | Sum ${formatNumber(sum)} | Avg ${formatNumber(average)} | Min ${formatNumber(Math.min(...numbers))} | Max ${formatNumber(Math.max(...numbers))}`;
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

function resolveSummaryOptions(value?: GridNexaSummaryOptions) {
  return {
    footer: false,
    selectedRange: false,
    ...(value === true ? { footer: true, selectedRange: true } : {}),
    ...(value && typeof value === "object" ? value : {}),
  };
}

function resolvePresetDefaults<T>(preset?: GridNexaPreset): Partial<GridNexaJavaScriptOptions<T>> {
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

  if (preset === "basic") {
    return {
      toolbar: false,
      footer: true,
      sidePanel: false,
      fillWidth: true,
    };
  }

  return {};
}

function applyPresetOptions<T>(options: GridNexaJavaScriptOptions<T>): GridNexaJavaScriptOptions<T> {
  const defaults = resolvePresetDefaults<T>(options.preset);

  return {
    ...defaults,
    ...options,
    toolbar: options.toolbar ?? defaults.toolbar,
    footer: options.footer ?? defaults.footer,
    sidePanel: options.sidePanel ?? defaults.sidePanel,
    fillWidth: options.fillWidth ?? defaults.fillWidth,
    rowNumbers: options.rowNumbers ?? defaults.rowNumbers,
    checkboxSelection: options.checkboxSelection ?? defaults.checkboxSelection,
    enableRangeSelection: options.enableRangeSelection ?? defaults.enableRangeSelection,
    enableFillHandle: options.enableFillHandle ?? defaults.enableFillHandle,
    enableUndoRedo: options.enableUndoRedo ?? defaults.enableUndoRedo,
    enableRowReorder: options.enableRowReorder ?? defaults.enableRowReorder,
    pageSize: options.pageSize ?? defaults.pageSize,
  };
}

function resolveStateStorageOptions(value?: GridNexaStateStorageOptions) {
  if (!value || typeof value !== "object" || !value.key || value.type !== "localStorage") return null;
  return {
    key: value.key,
    persist: value.persist ?? ["columns", "filters", "sort", "pagination", "sidePanel"],
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readPersistedGridState(value?: GridNexaStateStorageOptions): PersistedGridState | null {
  const options = resolveStateStorageOptions(value);
  if (!options || !canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(options.key);
    return raw ? (JSON.parse(raw) as PersistedGridState) : null;
  } catch {
    return null;
  }
}

function writePersistedGridState(value: GridNexaStateStorageOptions | undefined, state: PersistedGridState) {
  const options = resolveStateStorageOptions(value);
  if (!options || !canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(options.key, JSON.stringify(state));
  } catch {
    // Persistence should never interrupt grid interaction.
  }
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
  private savedViews: Array<GridNexaDomSavedView<DomViewState>> = [];
  private activeViewId = GRIDNEXA_DEFAULT_VIEW_ID;
  private commandOpen = false;
  private reviewOpen = false;
  private diagnosticsOpen = false;
  private changeLog: GridNexaDomChangeEntry[] = [];
  private persistTimer: number | undefined;

  constructor(private readonly container: HTMLElement, options: GridNexaJavaScriptOptions<T>) {
    this.options = applyPresetOptions(options);
    const sidePanel = resolveSidePanelOptions(this.options.sidePanel);
    this.sideOpen =
      sidePanel.enabled && sidePanel.defaultActivePanel
        ? sidePanel.defaultActivePanel === "filters"
          ? "filters"
          : "columns"
        : null;
    this.columnOrder = this.columnOrder.length ? this.columnOrder : this.options.columns.map((column) => column.id);
    this.options.columns.forEach((column) => {
      if (column.width) this.columnWidths.set(column.id, column.width);
    });
    this.hiddenColumnIds = new Set([
      ...this.options.columns.filter((column) => column.hidden).map((column) => column.id),
      ...this.hiddenColumnIds,
    ]);
    this.hydratePersistedState();
    this.initProductivity();
    if (this.options.unstyled !== true) injectStyles();
    this.applyTransaction();
    this.bindKeyboard();
    this.attachApi();
    this.render();
  }

  update(options: Partial<GridNexaJavaScriptOptions<T>>) {
    this.options = applyPresetOptions({ ...this.options, ...options });
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
    if (this.persistTimer != null) window.clearTimeout(this.persistTimer);
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
    this.appendChange("add", `Added row ${rows.length}`);
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
    this.appendChange("delete", `Deleted row ${rowIndex + 1}`);
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
    this.appendChange("bulkDelete", `Deleted ${rowsToDelete.length} rows`);
    this.selectedIds.clear();
    this.emitRowsChange(rows, previousRows, "rowsDelete");
    this.options.onRowsDelete?.({ rows: rowsToDelete, rowIndexes, remainingRows: rows });
    this.render();
  }

  saveAll() {
    if (this.isSaveBlocked()) return;
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

  private initProductivity() {
    const views = resolveGridNexaSavedViews(this.options.views);
    this.savedViews = views.enabled ? readGridNexaSavedViews<DomViewState>(views.key) : [];
    this.diagnosticsOpen = shouldShowGridNexaDiagnostics(this.options.diagnostics);
    if (resolveGridNexaEnabled(this.options.commandPalette)) {
      window.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          this.commandOpen = !this.commandOpen;
          this.render();
        }
      });
    }
  }

  private captureViewState(): DomViewState {
    return {
      columnWidths: Object.fromEntries(this.options.columns.map((column) => [column.id, this.columnWidth(column)])),
      hiddenColumnIds: Array.from(this.hiddenColumnIds),
      pinnedColumnIds: Object.fromEntries(this.options.columns.filter((column) => column.pinned).map((column) => [column.id, column.pinned])),
      sortModel: this.sortState,
      filterModel: this.options.columnFilters,
      pageIndex: this.pageIndex,
      sidePanel: this.sideOpen,
    };
  }

  private applyViewState(state: DomViewState) {
    this.hiddenColumnIds = new Set(state.hiddenColumnIds ?? []);
    Object.entries(state.columnWidths ?? {}).forEach(([id, width]) => this.columnWidths.set(id, width));
    this.sortState = state.sortModel ?? null;
    this.options = { ...this.options, columnFilters: state.filterModel };
    this.pageIndex = state.pageIndex ?? 0;
    this.sideOpen = state.sidePanel ?? this.sideOpen;
    this.render();
  }

  private saveCurrentView() {
    const options = resolveGridNexaSavedViews(this.options.views);
    if (!options.enabled || !options.allowUserViews) return;
    const name = window.prompt("View name", this.activeViewId === GRIDNEXA_DEFAULT_VIEW_ID ? "My view" : this.savedViews.find((view) => view.id === this.activeViewId)?.name);
    if (!name) return;
    const now = Date.now();
    const existing = this.savedViews.find((view) => view.name === name);
    const view = { id: existing?.id ?? `${now}`, name, state: this.captureViewState(), createdAt: existing?.createdAt ?? now, updatedAt: now };
    this.savedViews = [view, ...this.savedViews.filter((entry) => entry.id !== view.id)].slice(0, 20);
    this.activeViewId = view.id;
    writeGridNexaSavedViews(options.key, this.savedViews);
    this.render();
  }

  private appendChange(type: GridNexaDomChangeEntry["type"], label: string) {
    if (!resolveGridNexaEnabled(this.options.changeReview)) return;
    this.changeLog = [{ id: `${Date.now()}-${this.changeLog.length}`, type, label, timestamp: Date.now() }, ...this.changeLog.slice(0, 49)];
  }

  private validationIssues() {
    const validation = resolveGridNexaValidation(this.options.validation);
    if (!validation.enabled) return [];
    const issues: Array<{ key: string; label: string }> = [];
    this.options.rows.forEach((row, rowIndex) => {
      this.options.columns.forEach((column, columnIndex) => {
        const rule = validation.rules[column.id] ?? validation.rules[String(column.field)];
        const message = getGridNexaValidationMessage(rule, getValue(row, column), row);
        if (message) issues.push({ key: `${rowIndex}:${columnIndex}`, label: `${column.headerName} row ${rowIndex + 1}: ${message}` });
      });
    });
    return issues;
  }

  private isSaveBlocked() {
    const validation = resolveGridNexaValidation(this.options.validation);
    return validation.blockSave && this.validationIssues().length > 0;
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

  private hydratePersistedState() {
    const storage = resolveStateStorageOptions(this.options.stateStorage);
    const persisted = readPersistedGridState(this.options.stateStorage);
    if (!storage || !persisted) return;
    if (storage.persist.includes("columns")) {
      if (persisted.columnOrder?.length) this.columnOrder = persisted.columnOrder;
      if (persisted.hiddenColumnIds?.length) this.hiddenColumnIds = new Set(persisted.hiddenColumnIds);
      Object.entries(persisted.columnWidths ?? {}).forEach(([columnId, width]) => this.columnWidths.set(columnId, width));
      this.options = {
        ...this.options,
        columns: this.options.columns.map((column) => ({
          ...column,
          width: persisted.columnWidths?.[column.id] ?? column.width,
          pinned: persisted.pinnedColumnIds?.[column.id] ?? column.pinned,
        })),
      };
    }
    if (storage.persist.includes("filters") && persisted.filterModel) {
      this.options = { ...this.options, columnFilters: persisted.filterModel };
    }
    if (storage.persist.includes("sort")) this.sortState = persisted.sortModel ?? this.sortState;
    if (storage.persist.includes("pagination") && typeof persisted.pageIndex === "number") this.pageIndex = persisted.pageIndex;
    if (storage.persist.includes("sidePanel")) this.sideOpen = persisted.sidePanel ?? this.sideOpen;
  }

  private schedulePersistState() {
    const storage = resolveStateStorageOptions(this.options.stateStorage);
    if (!storage) return;
    if (this.persistTimer != null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      const state: PersistedGridState = {};
      if (storage.persist.includes("columns")) {
        state.columnOrder = this.columnOrder;
        state.columnWidths = Object.fromEntries(this.columnWidths.entries());
        state.hiddenColumnIds = Array.from(this.hiddenColumnIds);
        state.pinnedColumnIds = Object.fromEntries(this.options.columns.map((column) => [column.id, column.pinned]));
      }
      if (storage.persist.includes("filters")) state.filterModel = this.options.columnFilters;
      if (storage.persist.includes("sort")) state.sortModel = this.sortState;
      if (storage.persist.includes("pagination")) state.pageIndex = this.pageIndex;
      if (storage.persist.includes("sidePanel")) state.sidePanel = this.sideOpen;
      writePersistedGridState(this.options.stateStorage, state);
    }, 120);
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

  private tableMinimumWidth(columns: Column<T>[]) {
    return (
      (this.options.checkboxSelection ? 44 : 0) +
      (this.options.rowNumbers ? 72 : 0) +
      columns.reduce((total, column) => total + this.columnWidth(column), 0)
    );
  }

  private fillWidthColumnIds(columns: Column<T>[]) {
    const fillWidth = resolveFillWidthOptions(this.options.fillWidth);
    if (!fillWidth.enabled || !columns.length) return new Set<string>();
    const fillableColumns = columns.filter((entry) => !entry.pinned);
    if (!fillableColumns.length) return new Set<string>();
    const flexColumns = fillableColumns.filter((entry) => (entry.flex ?? 0) > 0);
    const hasConfiguredWidths = fillableColumns.some(
      (entry) =>
        this.columnWidths.has(entry.id) ||
        entry.width != null ||
        (entry.flex ?? 0) > 0,
    );
    if (!hasConfiguredWidths) return new Set(fillableColumns.map((entry) => entry.id));
    if (fillWidth.mode !== "lastColumn" && flexColumns.length) return new Set(flexColumns.map((entry) => entry.id));
    return new Set([fillableColumns[fillableColumns.length - 1].id]);
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
    const width = (entry: Column<T>) => this.columnWidth(entry);
    const offset =
      column.pinned === "left"
        ? columns.slice(0, index).filter((entry) => entry.pinned === "left").reduce((sum, entry) => sum + width(entry), 0)
        : columns.slice(index + 1).filter((entry) => entry.pinned === "right").reduce((sum, entry) => sum + width(entry), 0);
    return {
      position: "sticky",
      [column.pinned]: `${offset}px`,
      zIndex: "3",
      background: "var(--gnx-pinned-bg,var(--gnx-bg))",
      boxShadow: column.pinned === "left" ? "inset -1px 0 0 var(--gnx-border)" : "inset 1px 0 0 var(--gnx-border)",
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
    root.className = ["sg-shell", "gnx-grid", this.options.className]
      .filter(Boolean)
      .join(" ");
    root.dataset.gnxTheme = this.options.theme ?? "dark";
    root.dataset.gnxDensity = this.options.density ?? "standard";
    root.dataset.gnxFillWidth = String(resolveFillWidthOptions(this.options.fillWidth).enabled);
    if (this.options.height != null) {
      root.style.height = typeof this.options.height === "number" ? `${this.options.height}px` : this.options.height;
    }
    const main = document.createElement("div");
    main.className = "sg-grid-workspace gnx-main";
    const toolbar = this.renderToolbar(columns, pivot.rows);
    if (toolbar) main.appendChild(toolbar);
    main.appendChild(this.renderTable(columns, displayRows));
    const overlay = this.renderOverlay(displayRows.length);
    if (overlay) main.appendChild(overlay);
    main.appendChild(this.renderStatus(pivot.rows.length));
    const sidePanel = this.renderSidePanel();
    sidePanel ? root.append(main, sidePanel) : root.appendChild(main);
    if (this.contextMenu) root.appendChild(this.renderContextMenu());
    this.appendProductivityPanels(root);
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
    this.schedulePersistState();
  }

  private renderOverlay(displayRowCount: number) {
    const hasError = this.options.error != null && this.options.error !== false;
    const isEmpty = !this.options.loading && !hasError && displayRowCount === 0;
    if (!this.options.loading && !hasError && !isEmpty) return null;
    const overlay = document.createElement("div");
    overlay.className = "gnx-overlay";
    const card = document.createElement("div");
    card.className = "gnx-overlay-card";
    card.dataset.kind = hasError ? "error" : this.options.loading ? "loading" : "empty";
    if (this.options.loading) {
      card.textContent = "Loading data...";
    } else if (hasError) {
      card.textContent =
        this.options.error instanceof Error
          ? this.options.error.message
          : typeof this.options.error === "string"
            ? this.options.error
            : "Something went wrong while loading the grid.";
    } else {
      card.textContent =
        typeof this.options.emptyState === "string"
          ? this.options.emptyState
          : this.options.emptyState == null
            ? "No rows to display"
            : String(this.options.emptyState);
    }
    overlay.appendChild(card);
    return overlay;
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
    toolbar.className = "sg-toolbar gnx-toolbar";
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
    if (toolbarOptions.pagination && this.options.pageSize) {
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
    if (resolveGridNexaSavedViews(this.options.views).enabled) actions.append(this.renderViewsControl());
    if (resolveGridNexaEnabled(this.options.commandPalette)) actions.appendChild(this.button("Commands", () => { this.commandOpen = true; this.render(); }));
    if (resolveGridNexaEnabled(this.options.changeReview)) actions.appendChild(this.button(`Review${this.changeLog.length ? ` (${this.changeLog.length})` : ""}`, () => { this.reviewOpen = !this.reviewOpen; this.render(); }));
    if (resolveGridNexaEnabled(this.options.diagnostics)) actions.appendChild(this.button("Diagnostics", () => { this.diagnosticsOpen = !this.diagnosticsOpen; this.render(); }));
    if (toolbarOptions.saveAll) {
      const save = this.button("Save all", () => this.saveAll());
      save.disabled = this.isSaveBlocked();
      actions.appendChild(save);
    }
    if (toolbarOptions.exportCsv) actions.appendChild(this.button("Export CSV", () => this.exportCsv(columns, rows)));
    if (toolbarOptions.exportExcel) actions.appendChild(this.button("Export Excel", () => this.exportExcel(columns, rows)));
    if (toolbarOptions.summary) toolbar.appendChild(summary);
    toolbar.appendChild(actions);
    return toolbar;
  }

  private renderViewsControl() {
    const wrap = document.createElement("span");
    const select = document.createElement("select");
    const defaultOption = document.createElement("option");
    defaultOption.value = GRIDNEXA_DEFAULT_VIEW_ID;
    defaultOption.textContent = "Default view";
    select.appendChild(defaultOption);
    this.savedViews.forEach((view) => {
      const option = document.createElement("option");
      option.value = view.id;
      option.textContent = view.name;
      select.appendChild(option);
    });
    select.value = this.activeViewId;
    select.addEventListener("change", () => {
      this.activeViewId = select.value;
      const view = this.savedViews.find((entry) => entry.id === select.value);
      view ? this.applyViewState(view.state) : this.applyViewState({});
    });
    wrap.append(select, this.button("Save view", () => this.saveCurrentView()));
    return wrap;
  }

  private appendProductivityPanels(root: HTMLElement) {
    const issues = this.validationIssues();
    const validation = resolveGridNexaValidation(this.options.validation);
    if (validation.showSummary && issues.length) root.appendChild(this.panel(`${issues.length} validation issues`, issues.slice(0, 5).map((issue) => issue.label)));
    if (this.reviewOpen) root.appendChild(this.panel("Change review", this.changeLog.length ? this.changeLog.map((entry) => entry.label) : ["No tracked changes"]));
    if (this.diagnosticsOpen) root.appendChild(this.panel("Diagnostics", [`Rows: ${this.options.rows.length}`, `Columns: ${this.options.columns.length}`, `Selected: ${this.selectedIds.size}`, `Changes: ${this.changeLog.length}`]));
    if (this.commandOpen) {
      const actions = [
        ["Save view", () => this.saveCurrentView()],
        ["Save all", () => this.saveAll()],
        ["Export CSV", () => this.exportCsv(this.effectiveColumns(), this.visibleRows())],
        ["Export Excel", () => this.exportExcel(this.effectiveColumns(), this.visibleRows())],
        ["Diagnostics", () => { this.diagnosticsOpen = true; }],
      ] as const;
      const panel = this.panel("Commands", []);
      actions.forEach(([label, run]) => panel.appendChild(this.button(label, () => { run(); this.commandOpen = false; this.render(); })));
      root.appendChild(panel);
    }
  }

  private panel(title: string, lines: string[]) {
    const panel = document.createElement("div");
    panel.className = "gnx-panel";
    panel.style.cssText = "position:relative;z-index:20;margin:8px;padding:12px;border:1px solid rgba(30,64,175,.16);border-radius:10px;background:#fff;color:#0f172a;box-shadow:0 18px 48px rgba(15,23,42,.12)";
    const strong = document.createElement("strong");
    strong.textContent = title;
    panel.appendChild(strong);
    lines.forEach((line) => {
      const div = document.createElement("div");
      div.textContent = line;
      panel.appendChild(div);
    });
    return panel;
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
    const fillColumnIds = this.fillWidthColumnIds(columns);
    const viewport = document.createElement("div");
    viewport.className = "sg-grid-root";
    const table = document.createElement("table");
    table.className = "sg-grid-table gnx-table";
    const minTableWidth = this.tableMinimumWidth(columns);
    table.style.cssText = fillWidth.enabled
      ? `width:max(100%,${minTableWidth}px);min-width:${minTableWidth}px`
      : `width:${minTableWidth}px;min-width:${minTableWidth}px`;
    const thead = document.createElement("thead");
    const leading = Number(this.options.checkboxSelection) + Number(this.options.rowNumbers);
    const colgroup = document.createElement("colgroup");
    if (this.options.checkboxSelection) {
      const selectionCol = document.createElement("col");
      selectionCol.style.width = "44px";
      colgroup.appendChild(selectionCol);
    }
    if (this.options.rowNumbers) {
      const rowNumberCol = document.createElement("col");
      rowNumberCol.style.width = "72px";
      colgroup.appendChild(rowNumberCol);
    }
    columns.forEach((column) => {
      const col = document.createElement("col");
      col.style.width = fillColumnIds.has(column.id) ? "auto" : `${this.columnWidth(column)}px`;
      col.style.minWidth = `${this.columnWidth(column)}px`;
      colgroup.appendChild(col);
    });
    table.appendChild(colgroup);
    if (this.options.mergedHeaders?.length) thead.appendChild(this.renderMergedHeaders(columns, leading));
    thead.className = "sg-header";
    const header = document.createElement("tr");
    header.className = "sg-column-header-row";
    if (this.options.checkboxSelection) header.appendChild(cell("", "th")).className = "sg-header-cell sg-selection-header gnx-control";
    if (this.options.rowNumbers) header.appendChild(cell("#", "th")).className = "sg-header-cell sg-row-number-header gnx-control";
    columns.forEach((column, columnIndex) => {
      const tools = resolveToolOptions(this.options, column);
      const th = cell(column.headerName, "th");
      th.className = classNameList(
        "sg-header-cell",
        this.options.classNames?.headerCell,
        typeof column.headerClassName === "function"
          ? column.headerClassName({ column })
          : column.headerClassName,
        this.options.getHeaderClassName?.({ column, columnIndex }),
      );
      th.dataset.gnxDraggable = String(Boolean(tools.menu));
      const existingLabel = th.textContent ?? "";
      th.textContent = "";
      const content = document.createElement("span");
      content.className = "sg-header-content";
      const main = document.createElement("span");
      main.className = "sg-header-main";
      const dragHandle = document.createElement("span");
      dragHandle.className = "sg-column-drag-handle";
      dragHandle.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "sg-header-label";
      label.textContent = existingLabel;
      const actions = document.createElement("span");
      actions.className = "sg-header-actions";
      const addHeaderButton = (text: string, title: string, onClick: () => void) => {
        const action = document.createElement("button");
        action.type = "button";
        action.className = "sg-header-icon-button";
        action.title = title;
        action.setAttribute("aria-label", title);
        action.textContent = text;
        action.addEventListener("click", (event) => {
          event.stopPropagation();
          onClick();
        });
        actions.appendChild(action);
      };
      if (tools.sort) addHeaderButton("↕", `Sort ${column.headerName}`, () => {
        this.sortState = this.sortState?.columnId !== column.id ? { columnId: column.id, direction: "asc" } : this.sortState.direction === "asc" ? { columnId: column.id, direction: "desc" } : null;
        const model = this.sortState ? [this.sortState] : [];
        this.options.onSortModelChange?.(model);
        this.options.onSortChanged?.(model);
        this.render();
      });
      if (tools.filter || tools.filterPanel) addHeaderButton("▽", `Add filter for ${column.headerName}`, () => {
        return;
      });
      if (tools.menu) addHeaderButton("⋮", `Column menu for ${column.headerName}`, () => {
        return;
      });
      main.append(dragHandle, label);
      content.append(main, actions);
      th.appendChild(content);
      const shouldFill = fillColumnIds.has(column.id);
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
        resizer.className = "sg-resize-handle gnx-resizer";
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
    viewport.appendChild(table);
    return viewport;
  }

  private renderStatus(totalRows: number) {
    const footer = this.options.footer;
    if (footer === false) return document.createDocumentFragment();
    const columns = this.effectiveColumns();
    const visibleRows = this.visibleRows();
    const summaryOptions = resolveSummaryOptions(this.options.summaries);
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
    status.className = "sg-status-bar gnx-status";
    const state = {
      rowCountLabel: `${totalRows} rows`,
      selectedRowsLabel: `${this.selectedIds.size} selected`,
      activeCellLabel: this.activeCell ? `Cell ${this.activeCell.rowIndex + 1}:${this.activeCell.columnId}` : "No cell",
      selectedRangeLabel: this.rangeAnchor && this.rangeEnd ? "Range selected" : "No range",
      summaryLabel: summaryOptions.footer
        ? buildSummaryLabel(
            visibleRows.flatMap((row) => columns.map((column) => getResolvedValue(row, column, this.options.columns))),
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
                    .map((column) => getResolvedValue(row, column, this.options.columns)),
                ),
              "No numeric values in range",
            )
          : "",
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
    const appendStatus = (label: string) => {
      const item = document.createElement("span");
      item.textContent = label;
      status.appendChild(item);
    };
    if (footerOptions.rowCount) appendStatus(state.rowCountLabel);
    if (footerOptions.selectedRows) appendStatus(state.selectedRowsLabel);
    if (footerOptions.selectedCell) appendStatus(state.activeCellLabel);
    if (footerOptions.sortStatus) appendStatus(state.sortStatusLabel);
    if (summaryOptions.footer && state.summaryLabel) appendStatus(state.summaryLabel);
    if (summaryOptions.selectedRange && state.selectedRangeSummaryLabel) appendStatus(state.selectedRangeSummaryLabel);
    if (footerOptions.filterCount) appendStatus(state.filterCountLabel);
    if (footerOptions.selectedRange) appendStatus(state.selectedRangeLabel);
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
    row.className = "sg-merged-header-row";
    if (leading) {
      const spacer = cell("", "th");
      spacer.className = "sg-merged-header-cell";
      spacer.colSpan = leading;
      row.appendChild(spacer);
    }
    (this.options.mergedHeaders as MergedHeader[]).forEach((header) => {
      const count = header.columnIds.filter((columnId) => columns.some((column) => column.id === columnId)).length;
      if (!count) return;
      const th = cell(header.headerName, "th");
      th.className = "sg-merged-header-cell";
      th.colSpan = count;
      row.appendChild(th);
    });
    return row;
  }

  private appendGroupRow(tbody: HTMLTableSectionElement, entry: Extract<DisplayRow<T>, { kind: "group" }>, colSpan: number) {
    const tr = document.createElement("tr");
    tr.className = "sg-row sg-row--group gnx-group-row";
    const td = document.createElement("td");
    td.className = "sg-cell sg-group-label";
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
    detailRow.className = "sg-row sg-detail-row";
    detail.className = "sg-cell sg-detail-content gnx-detail";
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
      "sg-row",
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
    const displayRowNumber = (this.options.pageSize && this.options.pageSize > 0 ? this.pageIndex * this.options.pageSize : 0) + rowIndex + 1;
    if (this.options.checkboxSelection) {
      const td = document.createElement("td");
      td.className = "sg-cell sg-selection-cell gnx-control";
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
      const rowNumber = cell(String(displayRowNumber));
      rowNumber.className = "sg-cell sg-row-number gnx-control";
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
        "sg-cell",
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
      if (this.fillWidthColumnIds(columns).has(column.id)) td.style.width = "auto";
      else td.style.width = `${this.columnWidth(column)}px`;
      td.style.minWidth = `${this.columnWidth(column)}px`;
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
