import { defineComponent, h, onMounted, ref, watch, type PropType } from "vue";
import "../../react/src/styles/gridnexa.css";
import type {
  AdvancedFilterModel,
  Column,
  ColumnFilterModel,
  GridOptions,
  GridNexaClassName,
  GridNexaPreset,
  GridNexaStateStorageOptions,
  GridNexaSummaryOptions,
  GridNexaSavedViewsOptions,
  GridNexaCommandPaletteOptions,
  GridNexaChangeReviewOptions,
  GridNexaValidationOptions,
  GridNexaDiagnosticsOptions,
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

const runtimeStyleId = "gridnexa-dom-runtime-styles";

const runtimeStyles = `
.gridnexa-vue-grid,.gridnexa-angular-grid{box-sizing:border-box;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:10px;width:100%;min-width:0;color:var(--gnx-text,#0f172a);font:14px/1.45 Inter,"Segoe UI",system-ui,sans-serif;--gnx-bg:#fff;--gnx-panel:#fff;--gnx-panel-strong:#f8fafc;--gnx-text:#0f172a;--gnx-muted:#64748b;--gnx-heading:#111827;--gnx-border:#dbe3ef;--gnx-primary:#2563eb;--gnx-row-hover:#eff6ff;--gnx-header-bg:#f8fafc;--gnx-pinned-bg:#fff;--gnx-shadow:0 18px 48px rgba(15,23,42,.12)}
.gridnexa-vue-grid *,.gridnexa-angular-grid *{box-sizing:border-box}
.gridnexa-vue-grid[data-gnx-theme="dark"],.gridnexa-angular-grid[data-gnx-theme="dark"]{--gnx-bg:#070b18;--gnx-panel:#0f172a;--gnx-panel-strong:#111827;--gnx-text:#e5edf7;--gnx-muted:#9ca3af;--gnx-heading:#f8fafc;--gnx-border:rgba(148,163,184,.2);--gnx-primary:#60a5fa;--gnx-row-hover:rgba(96,165,250,.12);--gnx-header-bg:#0b1220;--gnx-pinned-bg:#080c18;--gnx-shadow:0 24px 70px rgba(4,8,20,.38);color:var(--gnx-text);background:transparent}
.gridnexa-vue-grid[data-gnx-density="compact"],.gridnexa-angular-grid[data-gnx-density="compact"]{--gnx-row-height:34px;--gnx-cell-pad:8px}
.gridnexa-vue-grid[data-gnx-density="standard"],.gridnexa-angular-grid[data-gnx-density="standard"]{--gnx-row-height:42px;--gnx-cell-pad:12px}
.gridnexa-vue-grid[data-gnx-density="comfortable"],.gridnexa-angular-grid[data-gnx-density="comfortable"]{--gnx-row-height:50px;--gnx-cell-pad:16px}
.gridnexa-vue-grid table,.gridnexa-angular-grid table{font:inherit;color:inherit;border-collapse:separate;border-spacing:0}
.gridnexa-vue-grid button,.gridnexa-vue-grid input,.gridnexa-vue-grid select,.gridnexa-angular-grid button,.gridnexa-angular-grid input,.gridnexa-angular-grid select{font:inherit}
.gridnexa-vue-grid button:disabled,.gridnexa-angular-grid button:disabled{opacity:.48;cursor:not-allowed}
.gridnexa-vue-grid .sg-grid-workspace,.gridnexa-angular-grid .sg-grid-workspace{display:grid;grid-template-columns:minmax(0,1fr) auto;min-height:0;overflow:hidden}
.gridnexa-vue-grid .sg-grid-root,.gridnexa-angular-grid .sg-grid-root{position:relative;width:100%;min-width:0;max-height:100%;overflow:auto;border:1px solid var(--gnx-border);border-radius:14px;background:var(--gnx-bg);box-shadow:var(--gnx-shadow);outline:none}
.gridnexa-vue-grid .sg-grid-table,.gridnexa-angular-grid .sg-grid-table{width:max-content;min-width:max-content;table-layout:fixed;border:0;border-radius:0;background:transparent;box-shadow:none}
.gridnexa-vue-grid .sg-grid-table[data-gnx-fill-width="true"],.gridnexa-angular-grid .sg-grid-table[data-gnx-fill-width="true"]{width:100%;min-width:100%}
.gridnexa-vue-grid .sg-header,.gridnexa-angular-grid .sg-header{position:sticky;top:0;z-index:5;background:var(--gnx-header-bg)}
.gridnexa-vue-grid .sg-header-cell,.gridnexa-angular-grid .sg-header-cell{position:relative;height:44px;min-height:44px;padding:0 14px;border-right:1px solid var(--gnx-border);border-bottom:1px solid var(--gnx-border);background:var(--gnx-header-bg);color:var(--gnx-heading);font-size:.78rem;font-weight:900;letter-spacing:.04em;text-align:left;text-transform:uppercase;white-space:nowrap;overflow:hidden;user-select:none}
.gridnexa-vue-grid .sg-header-content,.gridnexa-angular-grid .sg-header-content{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:100%;min-width:0}
.gridnexa-vue-grid .sg-header-main,.gridnexa-angular-grid .sg-header-main{display:inline-flex;align-items:center;gap:8px;min-width:0}
.gridnexa-vue-grid .sg-header-label,.gridnexa-angular-grid .sg-header-label{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gridnexa-vue-grid .sg-header-actions,.gridnexa-angular-grid .sg-header-actions{display:inline-flex;flex:0 0 auto;align-items:center;gap:4px}
.gridnexa-vue-grid .sg-header-icon-button,.gridnexa-angular-grid .sg-header-icon-button{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--gnx-muted);cursor:pointer}
.gridnexa-vue-grid .sg-header-icon-button:hover,.gridnexa-angular-grid .sg-header-icon-button:hover{background:var(--gnx-row-hover);color:var(--gnx-primary)}
.gridnexa-vue-grid .sg-header-icon-button svg,.gridnexa-angular-grid .sg-header-icon-button svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.gridnexa-vue-grid .sg-column-drag-handle,.gridnexa-angular-grid .sg-column-drag-handle{flex:0 0 auto;width:10px;height:18px;border-radius:4px;opacity:.72;background-image:radial-gradient(currentColor 1px,transparent 1.5px);background-size:5px 5px;color:var(--gnx-muted);cursor:grab}
.gridnexa-vue-grid .sg-resize-handle,.gridnexa-angular-grid .sg-resize-handle{position:absolute;top:0;right:0;width:10px;height:100%;margin:0;border-right:2px solid color-mix(in srgb,var(--gnx-primary) 28%,transparent);cursor:col-resize}
.gridnexa-vue-grid .sg-row:hover .sg-cell,.gridnexa-angular-grid .sg-row:hover .sg-cell{background:var(--gnx-row-hover)}
.gridnexa-vue-grid .sg-cell,.gridnexa-angular-grid .sg-cell{min-height:var(--gnx-row-height,42px);height:var(--gnx-row-height,42px);padding:0 var(--gnx-cell-pad,12px);border-right:1px solid var(--gnx-border);border-bottom:1px solid var(--gnx-border);background:var(--gnx-bg);color:var(--gnx-text);text-align:left;vertical-align:middle}
.gridnexa-vue-grid .sg-selection-cell,.gridnexa-vue-grid .sg-selection-header,.gridnexa-angular-grid .sg-selection-cell,.gridnexa-angular-grid .sg-selection-header{width:44px;min-width:44px;max-width:44px;padding:0;text-align:center;background:var(--gnx-panel-strong);color:var(--gnx-muted)}
.gridnexa-vue-grid .sg-row-number,.gridnexa-vue-grid .sg-row-number-header,.gridnexa-angular-grid .sg-row-number,.gridnexa-angular-grid .sg-row-number-header{width:72px;min-width:72px;max-width:72px;padding:0;text-align:center;background:var(--gnx-panel-strong);color:var(--gnx-muted)}
.gridnexa-vue-grid .sg-row-number,.gridnexa-angular-grid .sg-row-number{position:relative;padding-right:30px;text-align:center}
.gridnexa-vue-grid .sg-row-tools,.gridnexa-angular-grid .sg-row-tools{position:absolute;top:50%;right:4px;display:inline-flex;gap:2px;opacity:0;pointer-events:none;transform:translateY(-50%);transition:opacity .12s ease}
.gridnexa-vue-grid .sg-row:hover .sg-row-tools,.gridnexa-vue-grid .sg-row-number:focus-within .sg-row-tools,.gridnexa-angular-grid .sg-row:hover .sg-row-tools,.gridnexa-angular-grid .sg-row-number:focus-within .sg-row-tools{opacity:1;pointer-events:auto}
.gridnexa-vue-grid .sg-row-tools button,.gridnexa-angular-grid .sg-row-tools button{width:22px;min-height:22px;padding:0;border-radius:6px}
.gridnexa-vue-grid .sg-toolbar,.gridnexa-angular-grid .sg-toolbar{border-color:var(--gnx-border);background:var(--gnx-panel);box-shadow:var(--gnx-shadow)}
.gridnexa-vue-grid .sg-status-bar,.gridnexa-angular-grid .sg-status-bar{border-color:var(--gnx-border);background:var(--gnx-panel);color:var(--gnx-muted)}
`;

function injectGridNexaRuntimeStyles() {
  if (
    typeof document === "undefined" ||
    document.getElementById(runtimeStyleId)
  )
    return;
  const style = document.createElement("style");
  style.id = runtimeStyleId;
  style.textContent = runtimeStyles;
  document.head.appendChild(style);
}

export interface GridNexaVueOptions<
  T = Record<string, unknown>,
> extends GridOptions<T> {
  pageSize?: number;
  groupBy?: keyof T & string;
}

type RowRecord = Record<string, unknown>;
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
type CellEdit = {
  row: RowRecord;
  rowIndex: number;
  column: Column<RowRecord>;
  oldValue: unknown;
  newValue: unknown;
};
type DisplayRow =
  | {
      kind: "group";
      key: string;
      label: string;
      rows: RowRecord[];
      summaries: string;
    }
  | {
      kind: "data";
      row: RowRecord;
      rowIndex: number;
      depth?: number;
      treeKey?: string;
      hasChildren?: boolean;
    };

function rawValue<T>(row: T, column: Column<T>) {
  return column.valueGetter ? column.valueGetter(row) : row[column.field];
}

function evaluateFormula<T>(row: T, columns: Column<T>[], expression: string) {
  const formula = expression.trim().slice(1);
  if (!/^[\w\s.+\-*/()%]+$/.test(formula)) return expression;
  const resolved = columns.reduce((current, column) => {
    const numeric = Number(rawValue(row, column));
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

function value<T>(row: T, column: Column<T>, columns: Column<T>[]) {
  const current = rawValue(row, column);
  return typeof current === "string" && current.trim().startsWith("=")
    ? evaluateFormula(row, columns, current)
    : current;
}

function format<T>(row: T, column: Column<T>, columns: Column<T>[]) {
  const current = value(row, column, columns);
  return column.valueFormatter
    ? column.valueFormatter(current)
    : String(current ?? "");
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

function matches<T>(
  row: T,
  column: Column<T>,
  filter: ColumnFilterModel,
  columns: Column<T>[],
) {
  const raw = value(row, column, columns);
  const text = String(raw ?? "").toLowerCase();
  const needle = String(filter.value ?? "").toLowerCase();
  const numeric = Number(raw);
  const from = Number(filter.value);
  const to = Number(filter.valueTo);

  if (filter.operator === "blank") return !text.trim();
  if (filter.operator === "notBlank") return Boolean(text.trim());
  if (filter.operator === "in")
    return (filter.values ?? []).map(String).includes(String(raw ?? ""));
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

function matchesAdvanced<T>(
  row: T,
  columns: Column<T>[],
  model?: AdvancedFilterModel | null,
): boolean {
  if (!model || !activeAdvanced(model)) return true;
  if (model.kind === "group") {
    const active = model.conditions.filter(activeAdvanced);
    return model.joinOperator === "or"
      ? active.some((condition) => matchesAdvanced(row, columns, condition))
      : active.every((condition) => matchesAdvanced(row, columns, condition));
  }
  const column = columns.find((entry) => entry.id === model.columnId);
  return column
    ? matches(
        row,
        column,
        {
          operator: model.operator,
          value: model.value,
          valueTo: model.valueTo,
          values: model.values,
        },
        columns,
      )
    : true;
}

function aggregate(values: unknown[], aggregation: PivotAggregation) {
  if (aggregation === "count") return values.length;
  const numbers = values.map(Number).filter((entry) => !Number.isNaN(entry));
  if (!numbers.length) return 0;
  if (aggregation === "avg")
    return numbers.reduce((sum, entry) => sum + entry, 0) / numbers.length;
  if (aggregation === "min") return Math.min(...numbers);
  if (aggregation === "max") return Math.max(...numbers);
  return numbers.reduce((sum, entry) => sum + entry, 0);
}

function buildPivot<T extends RowRecord>(
  rows: T[],
  columns: Column<T>[],
  groupBy?: string,
  pivotBy?: string,
  pivotValueColumns?: string[],
  pivotAggregation: PivotAggregation = "sum",
) {
  if (!pivotBy) return { columns, rows, active: false };
  const valueFields = pivotValueColumns?.length
    ? pivotValueColumns
    : columns
        .filter((column) =>
          rows.some((row) => typeof value(row, column, columns) === "number"),
        )
        .map((column) => String(column.field));
  const pivotLabels = Array.from(
    new Set(rows.map((row) => String(row[pivotBy] ?? "Blank"))),
  );
  const groupLabels = Array.from(
    new Set(rows.map((row) => String(groupBy ? row[groupBy] : "Total"))),
  );
  const pivotColumns: Column<RowRecord>[] = [
    {
      id: "__group",
      field: "__group",
      headerName: groupBy ?? "Group",
      width: 180,
    },
    ...pivotLabels.flatMap((label) =>
      valueFields.map((field) => ({
        id: `${label}_${field}`,
        field: `${label}_${field}`,
        headerName: `${label} ${field}`,
        width: 140,
      })),
    ),
  ];
  const pivotRows = groupLabels.map((group) => {
    const output: RowRecord = { __group: group };
    pivotLabels.forEach((pivot) => {
      const bucket = rows.filter(
        (row) =>
          String(row[pivotBy] ?? "Blank") === pivot &&
          String(groupBy ? row[groupBy] : "Total") === group,
      );
      valueFields.forEach((field) => {
        output[`${pivot}_${field}`] = aggregate(
          bucket.map((row) => row[field]),
          pivotAggregation,
        );
      });
    });
    return output;
  });
  return {
    columns: pivotColumns as Column<T>[],
    rows: pivotRows as T[],
    active: true,
  };
}

function buildGroupSummary<T extends RowRecord>(
  rows: T[],
  columns: Column<T>[],
  groupBy?: string,
) {
  return columns
    .filter((column) => column.field !== groupBy)
    .map((column) => {
      const values = rows
        .map((row) => Number(value(row, column, columns)))
        .filter(Number.isFinite);
      return values.length
        ? `${column.headerName}: ${values.reduce((sum, entry) => sum + entry, 0).toLocaleString()}`
        : "";
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
  value:
    | GridNexaClassName
    | ((params: {
        value: unknown;
        row: T;
        rowIndex: number;
        column: Column<T>;
      }) => GridNexaClassName),
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

function resolveToolOptions(globalTools: unknown, column?: Column<RowRecord>) {
  const apply = (current: typeof defaultColumnTools, value: unknown) => {
    if (value === undefined) return current;
    if (typeof value === "boolean")
      return Object.fromEntries(
        Object.keys(current).map((key) => [key, value]),
      ) as typeof defaultColumnTools;
    return { ...current, ...(value as Partial<typeof defaultColumnTools>) };
  };

  return apply(
    apply(defaultColumnTools, globalTools),
    (column as (Column<RowRecord> & { tools?: unknown }) | undefined)?.tools,
  );
}

function resolveTextDisplay(globalDisplay: unknown, column: Column<RowRecord>) {
  return {
    overflow: "ellipsis" as const,
    showTooltip: true,
    ...((globalDisplay ?? {}) as object),
    ...(((column as Column<RowRecord> & { textDisplay?: object }).textDisplay ??
      {}) as object),
  } as { overflow?: "ellipsis" | "wrap" | "clip"; showTooltip?: boolean };
}

function estimateWidth(value: unknown) {
  return String(value ?? "").length * 8 + 44;
}

function resolvePresetDefaults(
  preset?: GridNexaPreset,
): Partial<GridNexaVueOptions<RowRecord>> {
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
      sidePanel: {
        enabled: true,
        columns: true,
        pivot: true,
        filters: true,
        defaultActivePanel: "columns",
      },
      fillWidth: true,
    };
  }
  if (preset === "basic")
    return { toolbar: false, footer: true, sidePanel: false, fillWidth: true };
  return {};
}

function resolveStateStorageOptions(value?: GridNexaStateStorageOptions) {
  if (
    !value ||
    typeof value !== "object" ||
    !value.key ||
    value.type !== "localStorage"
  )
    return null;
  return {
    key: value.key,
    persist: value.persist ?? [
      "columns",
      "filters",
      "sort",
      "pagination",
      "sidePanel",
    ],
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

function readPersistedGridState(
  value?: GridNexaStateStorageOptions,
): PersistedGridState | null {
  const options = resolveStateStorageOptions(value);
  if (!options || typeof window === "undefined" || !window.localStorage)
    return null;
  try {
    const raw = window.localStorage.getItem(options.key);
    return raw ? (JSON.parse(raw) as PersistedGridState) : null;
  } catch {
    return null;
  }
}

function writePersistedGridState(
  value: GridNexaStateStorageOptions | undefined,
  state: PersistedGridState,
) {
  const options = resolveStateStorageOptions(value);
  if (!options || typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(options.key, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

export const GridNexaVue = defineComponent({
  name: "GridNexaVue",
  props: {
    columns: { type: Array as PropType<Column<RowRecord>[]>, required: true },
    rows: { type: Array as PropType<RowRecord[]>, required: true },
    className: { type: String, default: undefined },
    theme: {
      type: String as PropType<GridNexaVueOptions<RowRecord>["theme"]>,
      default: "dark",
    },
    density: {
      type: String as PropType<GridNexaVueOptions<RowRecord>["density"]>,
      default: "standard",
    },
    height: {
      type: [Number, String] as PropType<number | string>,
      default: undefined,
    },
    unstyled: { type: Boolean, default: false },
    classNames: {
      type: Object as PropType<GridNexaVueOptions<RowRecord>["classNames"]>,
      default: () => ({}),
    },
    preset: { type: String as PropType<GridNexaPreset>, default: undefined },
    stateStorage: {
      type: Object as PropType<GridNexaStateStorageOptions>,
      default: undefined,
    },
    summaries: {
      type: [Boolean, Object] as PropType<GridNexaSummaryOptions>,
      default: undefined,
    },
    views: {
      type: [Boolean, Object] as PropType<GridNexaSavedViewsOptions>,
      default: undefined,
    },
    commandPalette: {
      type: [Boolean, Object] as PropType<GridNexaCommandPaletteOptions>,
      default: undefined,
    },
    changeReview: {
      type: [Boolean, Object] as PropType<GridNexaChangeReviewOptions>,
      default: undefined,
    },
    validation: {
      type: [Boolean, Object] as PropType<GridNexaValidationOptions>,
      default: undefined,
    },
    diagnostics: {
      type: [Boolean, Object] as PropType<GridNexaDiagnosticsOptions>,
      default: undefined,
    },
    loading: { type: Boolean, default: false },
    error: {
      type: [String, Object, Boolean] as PropType<unknown>,
      default: undefined,
    },
    emptyState: {
      type: [String, Object] as PropType<unknown>,
      default: undefined,
    },
    toolbar: {
      type: [Boolean, Object] as PropType<
        GridNexaVueOptions<RowRecord>["toolbar"]
      >,
      default: undefined,
    },
    footer: {
      type: [Boolean, Object] as PropType<
        GridNexaVueOptions<RowRecord>["footer"]
      >,
      default: undefined,
    },
    sidePanel: {
      type: [Boolean, Object] as PropType<
        GridNexaVueOptions<RowRecord>["sidePanel"]
      >,
      default: undefined,
    },
    fillWidth: {
      type: [Boolean, Object] as PropType<
        GridNexaVueOptions<RowRecord>["fillWidth"]
      >,
      default: undefined,
    },
    columnTools: {
      type: [Boolean, Object] as PropType<unknown>,
      default: undefined,
    },
    icons: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
    textDisplay: { type: Object as PropType<unknown>, default: undefined },
    createRow: {
      type: Function as PropType<() => RowRecord>,
      default: undefined,
    },
    apiRef: {
      type: Object as PropType<{ current: unknown }>,
      default: undefined,
    },
    getRowClassName: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["getRowClassName"]
      >,
      default: undefined,
    },
    getCellClassName: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["getCellClassName"]
      >,
      default: undefined,
    },
    getHeaderClassName: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["getHeaderClassName"]
      >,
      default: undefined,
    },
    mergedHeaders: {
      type: Array as PropType<MergedHeader[]>,
      default: undefined,
    },
    rowNumbers: { type: Boolean, default: undefined },
    checkboxSelection: { type: Boolean, default: false },
    enableRangeSelection: { type: Boolean, default: true },
    enableFillHandle: { type: Boolean, default: true },
    enableUndoRedo: { type: Boolean, default: true },
    enableRowReorder: { type: Boolean, default: false },
    rowReorderPosition: {
      type: String as PropType<
        GridNexaVueOptions<RowRecord>["rowReorderPosition"]
      >,
      default: "right",
    },
    quickFilterText: { type: String, default: "" },
    columnFilters: {
      type: Object as PropType<Record<string, ColumnFilterModel>>,
      default: undefined,
    },
    externalFilter: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["externalFilter"]
      >,
      default: undefined,
    },
    advancedFilter: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["advancedFilter"]
      >,
      default: undefined,
    },
    advancedFilterModel: {
      type: Object as PropType<AdvancedFilterModel | null>,
      default: undefined,
    },
    pageSize: { type: Number, default: undefined },
    groupBy: { type: String, default: undefined },
    pivotBy: { type: String, default: undefined },
    pivotValueColumns: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    pivotAggregation: {
      type: String as PropType<PivotAggregation>,
      default: "sum",
    },
    getRowId: {
      type: Function as PropType<GridNexaVueOptions<RowRecord>["getRowId"]>,
      default: undefined,
    },
    getTreeDataPath: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["getTreeDataPath"]
      >,
      default: undefined,
    },
    masterDetailRenderer: {
      type: Function as PropType<
        GridNexaVueOptions<RowRecord>["masterDetailRenderer"]
      >,
      default: undefined,
    },
    transaction: {
      type: Object as PropType<GridTransaction<RowRecord>>,
      default: undefined,
    },
    localeText: {
      type: Object as PropType<Record<string, string>>,
      default: undefined,
    },
    ai: { type: Object as PropType<GridNexaAiOptions>, default: undefined },
  },
  emits: [
    "rowSelectionChange",
    "selectionChanged",
    "rowSelected",
    "selectedRowChange",
    "rowOrderChange",
    "cellClick",
    "cellDoubleClick",
    "cellEditStart",
    "cellEditStop",
    "advancedFilterModelChange",
    "pivotModelChange",
    "cellValueChange",
    "sortChanged",
    "filterChanged",
    "columnMoved",
    "columnResized",
    "columnVisible",
    "columnPinned",
    "saveAll",
    "dataChange",
    "rowAdd",
    "rowDelete",
    "rowsDelete",
    "serverSideOperation",
  ],
  setup(props, { emit }) {
    const host = ref<HTMLElement | null>(null);
    const pageIndex = ref(0);
    const selected = new Set<string | number>();
    let sortState: SortState = null;
    let activeCell: CellPoint | null = null;
    let rangeAnchor: CellPoint | null = null;
    let rangeEnd: CellPoint | null = null;
    let contextMenu: {
      x: number;
      y: number;
      rowIndex: number;
      columnId: string;
    } | null = null;
    let headerPopover:
      | {
          type: "filter" | "menu";
          columnId: string;
          x: number;
          y: number;
        }
      | null = null;
    let localQuickFilterText = props.quickFilterText;
    let localColumnFilters: Record<string, ColumnFilterModel> = {
      ...(props.columnFilters ?? {}),
    };
    let findText = "";
    let toolsOpen = false;
    let draggedColumnId: string | null = null;
    let draggedRowIndex: number | null = null;
    let aiPrompt = "";
    let aiPlan: GridNexaCommandPlan | null = null;
    let aiBusy = false;
    let aiError: string | null = null;
    let workingColumns = [...props.columns];
    let workingRows = [...props.rows];
    const hiddenColumnIds = new Set(
      props.columns
        .filter((column) => column.hidden)
        .map((column) => column.id),
    );
    const expandedDetailIds = new Set<string | number>();
    const collapsedGroups = new Set<string>();
    const collapsedTreeKeys = new Set<string>();
    const columnWidths = new Map<string, number>();
    const undoStack: CellEdit[] = [];
    const redoStack: CellEdit[] = [];
    let hydratedStorageKey: string | null = null;
    let persistTimer: number | undefined;

    const presetDefaults = () => resolvePresetDefaults(props.preset);
    const effectiveToolbar = () => props.toolbar ?? presetDefaults().toolbar;
    const effectiveFooter = () => props.footer ?? presetDefaults().footer;
    const effectiveFillWidth = () =>
      props.fillWidth ?? presetDefaults().fillWidth;
    const effectivePageSize = () => props.pageSize ?? presetDefaults().pageSize;
    const effectiveRowNumbers = () =>
      props.rowNumbers ?? Boolean(presetDefaults().rowNumbers);
    const effectiveCheckboxSelection = () =>
      props.checkboxSelection || Boolean(presetDefaults().checkboxSelection);
    const effectiveRangeSelection = () =>
      props.enableRangeSelection ||
      Boolean(presetDefaults().enableRangeSelection);
    const effectiveFillHandle = () =>
      props.enableFillHandle || Boolean(presetDefaults().enableFillHandle);
    const effectiveUndoRedo = () =>
      props.enableUndoRedo || Boolean(presetDefaults().enableUndoRedo);
    const effectiveRowReorder = () =>
      props.enableRowReorder || Boolean(presetDefaults().enableRowReorder);

    const applyPersistedState = () => {
      const storage = resolveStateStorageOptions(props.stateStorage);
      if (!storage || hydratedStorageKey === storage.key) return;
      const persisted = readPersistedGridState(props.stateStorage);
      hydratedStorageKey = storage.key;
      if (!persisted) return;
      if (storage.persist.includes("columns")) {
        if (persisted.hiddenColumnIds) {
          hiddenColumnIds.clear();
          persisted.hiddenColumnIds.forEach((columnId) =>
            hiddenColumnIds.add(columnId),
          );
        }
        Object.entries(persisted.columnWidths ?? {}).forEach(
          ([columnId, width]) => columnWidths.set(columnId, width),
        );
        workingColumns = workingColumns.map((column) => ({
          ...column,
          width: persisted.columnWidths?.[column.id] ?? column.width,
          pinned: persisted.pinnedColumnIds?.[column.id] ?? column.pinned,
        }));
      }
      if (storage.persist.includes("sort"))
        sortState = persisted.sortModel ?? sortState;
      if (
        storage.persist.includes("pagination") &&
        typeof persisted.pageIndex === "number"
      )
        pageIndex.value = persisted.pageIndex;
    };

    const schedulePersistState = () => {
      const storage = resolveStateStorageOptions(props.stateStorage);
      if (!storage) return;
      if (persistTimer != null) window.clearTimeout(persistTimer);
      persistTimer = window.setTimeout(() => {
        const state: PersistedGridState = {};
        if (storage.persist.includes("columns")) {
          state.columnWidths = Object.fromEntries(columnWidths.entries());
          state.hiddenColumnIds = Array.from(hiddenColumnIds);
          state.pinnedColumnIds = Object.fromEntries(
            workingColumns.map((column) => [column.id, column.pinned]),
          );
        }
        if (storage.persist.includes("filters"))
          state.filterModel = props.columnFilters;
        if (storage.persist.includes("sort")) state.sortModel = sortState;
        if (storage.persist.includes("pagination"))
          state.pageIndex = pageIndex.value;
        writePersistedGridState(props.stateStorage, state);
      }, 120);
    };

    const rowId = (row: RowRecord, index: number) =>
      props.getRowId?.(row, index) ?? index;
    const emitDataChange = (
      rows: RowRecord[],
      previousRows: RowRecord[],
      reason: string,
    ) => {
      emit("dataChange", { rows, previousRows, reason });
    };
    const createRowValue = () =>
      props.createRow
        ? props.createRow()
        : Object.fromEntries(
            workingColumns.map((column) => [column.field, ""]),
          );
    const addRow = (row = createRowValue()) => {
      const previousRows = workingRows;
      workingRows = [...workingRows, row];
      emitDataChange(workingRows, previousRows, "rowAdd");
      emit("rowAdd", {
        row,
        rowIndex: workingRows.length - 1,
        rows: workingRows,
      });
      render();
    };
    const deleteRow = (rowIndex: number) => {
      const row = workingRows[rowIndex];
      if (!row) return;
      const previousRows = workingRows;
      workingRows = workingRows.filter((_, index) => index !== rowIndex);
      selected.delete(rowId(row, rowIndex));
      emitDataChange(workingRows, previousRows, "rowDelete");
      emit("rowDelete", {
        row,
        rowIndex,
        rows: [row],
        remainingRows: workingRows,
      });
      render();
    };
    const deleteSelectedRows = () => {
      const previousRows = workingRows;
      const rowIndexes: number[] = [];
      const rowsToDelete = workingRows.filter((row, index) => {
        const isSelected = selected.has(rowId(row, index));
        if (isSelected) rowIndexes.push(index);
        return isSelected;
      });
      if (!rowsToDelete.length) return;
      workingRows = workingRows.filter(
        (row, index) => !selected.has(rowId(row, index)),
      );
      selected.clear();
      emitDataChange(workingRows, previousRows, "rowsDelete");
      emit("rowsDelete", {
        rows: rowsToDelete,
        rowIndexes,
        remainingRows: workingRows,
      });
      render();
    };
    const saveAllRows = (reason: "toolbar" | "api" = "api") => {
      emit("saveAll", {
        rows: workingRows,
        selectedRows: workingRows.filter((row, index) =>
          selected.has(rowId(row, index)),
        ),
        visibleRows: visibleRows(),
        reason,
      });
    };
    const attachApi = () => {
      if (!props.apiRef) return;
      props.apiRef.current = {
        getRows: () => workingRows,
        setRows: (rows: RowRecord[]) => {
          const previousRows = workingRows;
          workingRows = rows;
          emitDataChange(workingRows, previousRows, "transaction");
          render();
        },
        addRow,
        deleteRow,
        deleteSelectedRows,
        saveAll: () => saveAllRows("api"),
      };
    };
    const syncWorkingData = () => {
      workingRows = [...props.rows];
      workingColumns = [...props.columns];
      localColumnFilters = { ...(props.columnFilters ?? {}) };
      props.columns
        .filter((column) => column.hidden)
        .forEach((column) => hiddenColumnIds.add(column.id));
      props.columns.forEach((column) => {
        if (column.width && !columnWidths.has(column.id))
          columnWidths.set(column.id, column.width);
      });
      applyPersistedState();
    };
    const visibleRows = () => {
      const query = localQuickFilterText.trim().toLowerCase();
      const rows = workingRows.filter((row) => {
        if (props.externalFilter && !props.externalFilter(row)) return false;
        if (props.advancedFilter && !props.advancedFilter(row)) return false;
        if (!matchesAdvanced(row, workingColumns, props.advancedFilterModel))
          return false;
        if (
          query &&
          !workingColumns.some((column) =>
            String(value(row, column, workingColumns) ?? "")
              .toLowerCase()
              .includes(query),
          )
        )
          return false;
        return Object.entries(localColumnFilters).every(
          ([columnId, filter]) => {
            const column = workingColumns.find(
              (entry) => entry.id === columnId,
            );
            return column ? matches(row, column, filter, workingColumns) : true;
          },
        );
      });
      if (!sortState) return rows;
      const column = workingColumns.find(
        (entry) => entry.id === sortState?.columnId,
      );
      if (!column) return rows;
      return [...rows].sort((left, right) => {
        const comparison = String(
          value(left, column, workingColumns) ?? "",
        ).localeCompare(
          String(value(right, column, workingColumns) ?? ""),
          undefined,
          { numeric: true },
        );
        return sortState?.direction === "asc" ? comparison : -comparison;
      });
    };

    const setCellValue = (
      row: RowRecord,
      rowIndex: number,
      column: Column<RowRecord>,
      nextValue: unknown,
      trackHistory = true,
    ) => {
      const oldValue = rawValue(row, column);
      const newValue =
        typeof oldValue === "number" ? Number(nextValue) : nextValue;
      if (trackHistory && effectiveUndoRedo()) {
        undoStack.push({ row, rowIndex, column, oldValue, newValue });
        redoStack.length = 0;
      }
      row[column.field] = newValue;
      emit("cellValueChange", { row, rowIndex, column, oldValue, newValue });
      emit("cellEditStop", { row, rowIndex, column, oldValue, newValue });
    };

    const undo = () => {
      const edit = undoStack.pop();
      if (!edit) return;
      setCellValue(edit.row, edit.rowIndex, edit.column, edit.oldValue, false);
      redoStack.push(edit);
      render();
    };

    const redo = () => {
      const edit = redoStack.pop();
      if (!edit) return;
      setCellValue(edit.row, edit.rowIndex, edit.column, edit.newValue, false);
      undoStack.push(edit);
      render();
    };

    const fillDown = () => {
      if (!activeCell || !effectiveFillHandle()) return;
      const column = workingColumns.find(
        (entry) => entry.id === activeCell?.columnId,
      );
      if (rangeAnchor && rangeEnd && column) {
        const minRow = Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex);
        const maxRow = Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex);
        const sourceRow = workingRows[minRow];
        if (!sourceRow || column.editable === false) return;
        const sourceValue = rawValue(sourceRow, column);
        for (let rowIndex = minRow + 1; rowIndex <= maxRow; rowIndex += 1) {
          const row = workingRows[rowIndex];
          if (row) setCellValue(row, rowIndex, column, sourceValue);
        }
        render();
        return;
      }
      const sourceRow = workingRows[activeCell.rowIndex];
      const targetRow = workingRows[activeCell.rowIndex + 1];
      if (!sourceRow || !targetRow || !column || column.editable === false)
        return;
      setCellValue(
        targetRow,
        activeCell.rowIndex + 1,
        column,
        rawValue(sourceRow, column),
      );
      render();
    };

    const copyActiveCell = async () => {
      if (!activeCell || typeof navigator === "undefined") return;
      if (rangeAnchor && rangeEnd) {
        const columns = workingColumns.filter(
          (column) => !column.hidden && !hiddenColumnIds.has(column.id),
        );
        const anchorColumn = columns.findIndex(
          (entry) => entry.id === rangeAnchor?.columnId,
        );
        const endColumn = columns.findIndex(
          (entry) => entry.id === rangeEnd?.columnId,
        );
        const text = workingRows
          .slice(
            Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex),
            Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex) + 1,
          )
          .map((row) =>
            columns
              .slice(
                Math.min(anchorColumn, endColumn),
                Math.max(anchorColumn, endColumn) + 1,
              )
              .map((column) => format(row, column, workingColumns))
              .join("\t"),
          )
          .join("\n");
        await navigator.clipboard?.writeText(text);
        return;
      }
      const row = workingRows[activeCell.rowIndex];
      const column = workingColumns.find(
        (entry) => entry.id === activeCell?.columnId,
      );
      if (!row || !column) return;
      await navigator.clipboard?.writeText(format(row, column, workingColumns));
    };

    const pasteActiveCell = async () => {
      if (!activeCell || typeof navigator === "undefined") return;
      const text = await navigator.clipboard?.readText();
      const columns = workingColumns.filter(
        (column) => !column.hidden && !hiddenColumnIds.has(column.id),
      );
      const startColumn = columns.findIndex(
        (entry) => entry.id === activeCell?.columnId,
      );
      text.split(/\r?\n/).forEach((line, rowOffset) => {
        line.split("\t").forEach((value, columnOffset) => {
          const rowIndex = activeCell!.rowIndex + rowOffset;
          const row = workingRows[rowIndex];
          const column = columns[startColumn + columnOffset];
          if (row && column && column.editable !== false)
            setCellValue(row, rowIndex, column, value);
        });
      });
      render();
    };

    const moveRow = (rowIndex: number, direction: -1 | 1) => {
      const nextIndex = rowIndex + direction;
      if (nextIndex < 0 || nextIndex >= workingRows.length) return;
      const [row] = workingRows.splice(rowIndex, 1);
      workingRows.splice(nextIndex, 0, row);
      emit("rowOrderChange", {
        rows: workingRows,
        movedRow: row,
        sourceIndex: rowIndex,
        targetIndex: nextIndex,
      });
      render();
    };

    const reorderRow = (sourceIndex: number, targetIndex: number) => {
      if (
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= workingRows.length ||
        targetIndex >= workingRows.length
      )
        return;
      const [row] = workingRows.splice(sourceIndex, 1);
      workingRows.splice(targetIndex, 0, row);
      emit("rowOrderChange", {
        rows: workingRows,
        movedRow: row,
        sourceIndex,
        targetIndex,
      });
      render();
    };

    const moveColumn = (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;
      const sourceIndex = workingColumns.findIndex(
        (column) => column.id === sourceId,
      );
      const targetIndex = workingColumns.findIndex(
        (column) => column.id === targetId,
      );
      if (sourceIndex < 0 || targetIndex < 0) return;
      const [column] = workingColumns.splice(sourceIndex, 1);
      workingColumns.splice(targetIndex, 0, column);
      emit("columnMoved", {
        columnId: column.id,
        sourceIndex,
        targetIndex,
        columnIds: workingColumns.map((entry) => entry.id),
      });
      render();
    };

    const resolveColumn = (idOrField?: string | null) =>
      idOrField
        ? workingColumns.find(
            (column) => column.id === idOrField || column.field === idOrField,
          )
        : undefined;

    const createAiRequest = (prompt: string): GridNexaAiRequest => ({
      prompt,
      state: {
        columns: workingColumns.map((column) => ({
          id: column.id,
          field: String(column.field),
          headerName: column.headerName,
          type:
            typeof column.filter === "string"
              ? column.filter
              : column.filter?.type,
          hidden: hiddenColumnIds.has(column.id) || column.hidden,
          pinned: column.pinned,
        })),
        rowCount: workingRows.length,
        sampleRows: workingRows
          .slice(0, props.ai?.sampleRowCount ?? 8)
          .map((row) =>
            Object.fromEntries(
              workingColumns.map((column) => [
                String(column.field),
                value(row, column, workingColumns),
              ]),
            ),
          ),
        quickFilterText: localQuickFilterText,
        groupBy: props.groupBy,
        pivotBy: props.pivotBy,
        pivotValueColumns: props.pivotValueColumns,
        pivotAggregation: props.pivotAggregation,
        activeColumnFilters: props.columnFilters,
        advancedFilterModel: props.advancedFilterModel,
      },
    });

    const applyAiAction = (action: GridNexaCommandAction) => {
      if (action.type === "quickFilter") {
        localQuickFilterText = action.value;
        pageIndex.value = 0;
      } else if (action.type === "setColumnFilter") {
        const column = resolveColumn(action.columnId);
        if (column)
          emit("advancedFilterModelChange", {
            kind: "group",
            joinOperator: "and",
            conditions: action.filter
              ? [
                  {
                    kind: "rule",
                    columnId: column.id,
                    operator: action.filter.operator,
                    value: action.filter.value,
                    valueTo: action.filter.valueTo,
                    values: action.filter.values,
                  },
                ]
              : [],
          } satisfies AdvancedFilterModel);
      } else if (action.type === "setAdvancedFilter") {
        emit("advancedFilterModelChange", action.model);
      } else if (action.type === "sort") {
        const column = resolveColumn(action.columnId);
        sortState =
          column && action.direction
            ? { columnId: column.id, direction: action.direction }
            : null;
      } else if (action.type === "group") {
        const column = resolveColumn(action.columnId);
        emit("pivotModelChange", {
          groupBy: column?.field,
          pivotBy: props.pivotBy,
          pivotValueColumns: props.pivotValueColumns ?? [],
          pivotAggregation: props.pivotAggregation,
        });
      } else if (action.type === "pivot") {
        const groupColumn = resolveColumn(action.groupBy);
        const pivotColumn = resolveColumn(action.pivotBy);
        const valueColumns = (action.valueColumns ?? [])
          .map((columnId) => resolveColumn(columnId)?.field)
          .filter(Boolean) as string[];
        emit("pivotModelChange", {
          groupBy: action.groupBy === null ? undefined : groupColumn?.field,
          pivotBy: action.pivotBy === null ? undefined : pivotColumn?.field,
          pivotValueColumns: valueColumns.length
            ? valueColumns
            : (props.pivotValueColumns ?? []),
          pivotAggregation: action.aggregation ?? props.pivotAggregation,
        });
      } else if (action.type === "pinColumn") {
        const column = resolveColumn(action.columnId);
        if (column) column.pinned = action.pinned ?? undefined;
      } else if (action.type === "hideColumn") {
        const column = resolveColumn(action.columnId);
        if (column)
          action.hidden
            ? hiddenColumnIds.add(column.id)
            : hiddenColumnIds.delete(column.id);
      } else if (action.type === "export") {
        const visible = workingColumns.filter(
          (column) => !hiddenColumnIds.has(column.id) && !column.hidden,
        );
        download(visible, visibleRows(), action.format === "excel");
      }
      render();
    };

    const applyAiPlan = (plan: GridNexaCommandPlan) => {
      plan.actions.forEach(applyAiAction);
      props.ai?.onApply?.(plan);
      aiPlan = null;
    };

    const requestAiPlan = async () => {
      const prompt = aiPrompt.trim();
      if (!prompt || aiBusy) return;
      aiBusy = true;
      aiError = null;
      render();
      try {
        const request = createAiRequest(prompt);
        const result = props.ai?.provider
          ? await props.ai.provider(request)
          : props.ai?.endpoint
            ? await (
                await (props.ai.fetcher ?? fetch)(props.ai.endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(request),
                })
              ).json()
            : null;
        const plan =
          result && "plan" in result
            ? result.plan
            : (result as GridNexaCommandPlan);
        if (!plan?.actions?.length)
          throw new Error("AI did not return any grid actions.");
        aiPlan = plan;
        props.ai?.onPlan?.(plan);
        if (props.ai?.autoApply) applyAiPlan(plan);
      } catch (error) {
        aiError = error instanceof Error ? error.message : "AI request failed";
        props.ai?.onError?.(error);
      } finally {
        aiBusy = false;
        render();
      }
    };

    const makeDisplayRows = (rows: RowRecord[]): DisplayRow[] => {
      if (props.groupBy) {
        const groupBy = props.groupBy;
        const buckets = new Map<string, RowRecord[]>();
        rows.forEach((row) => {
          const key = String(row[groupBy] ?? "Ungrouped");
          buckets.set(key, [...(buckets.get(key) ?? []), row]);
        });
        return Array.from(buckets.entries()).flatMap(([key, bucket]) => [
          {
            kind: "group" as const,
            key,
            label: key,
            rows: bucket,
            summaries: buildGroupSummary(bucket, workingColumns, groupBy),
          },
          ...(collapsedGroups.has(key)
            ? []
            : bucket.map((row) => ({
                kind: "data" as const,
                row,
                rowIndex: workingRows.indexOf(row),
              }))),
        ]);
      }
      if (props.getTreeDataPath) {
        return rows
          .map((row) => {
            const path = props.getTreeDataPath?.(row).filter(Boolean) ?? [];
            return { row, path, key: path.join("/") };
          })
          .sort((left, right) => left.key.localeCompare(right.key))
          .filter((entry) =>
            entry.path
              .slice(0, -1)
              .every(
                (_, index) =>
                  !collapsedTreeKeys.has(
                    entry.path.slice(0, index + 1).join("/"),
                  ),
              ),
          )
          .map((entry, _index, entries) => ({
            kind: "data" as const,
            row: entry.row,
            rowIndex: workingRows.indexOf(entry.row),
            depth: Math.max(0, entry.path.length - 1),
            treeKey: entry.key,
            hasChildren: entries.some((other) =>
              other.key.startsWith(`${entry.key}/`),
            ),
          }));
      }
      return rows.map((row) => ({
        kind: "data",
        row,
        rowIndex: workingRows.indexOf(row),
      }));
    };

    const isCellInRange = (
      rowIndex: number,
      columnId: string,
      columns: Column<RowRecord>[],
    ) => {
      if (!rangeAnchor || !rangeEnd || !effectiveRangeSelection()) return false;
      const columnIndex = columns.findIndex((column) => column.id === columnId);
      const anchorIndex = columns.findIndex(
        (column) => column.id === rangeAnchor?.columnId,
      );
      const endIndex = columns.findIndex(
        (column) => column.id === rangeEnd?.columnId,
      );
      return (
        rowIndex >= Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex) &&
        rowIndex <= Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex) &&
        columnIndex >= Math.min(anchorIndex, endIndex) &&
        columnIndex <= Math.max(anchorIndex, endIndex)
      );
    };

    const startColumnResize = (
      event: MouseEvent,
      column: Column<RowRecord>,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = columnWidth(column);
      const move = (moveEvent: MouseEvent) => {
        columnWidths.set(
          column.id,
          Math.max(72, startWidth + moveEvent.clientX - startX),
        );
        render();
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };

    const setColumnFilter = (
      columnId: string,
      filter: ColumnFilterModel | null,
    ) => {
      if (filter) {
        localColumnFilters = { ...localColumnFilters, [columnId]: filter };
      } else {
        const { [columnId]: _removed, ...remaining } = localColumnFilters;
        localColumnFilters = remaining;
      }
      pageIndex.value = 0;
      emit("filterChanged", localColumnFilters);
      render();
    };

    const autoSizeColumn = (column: Column<RowRecord>) => {
      const width = Math.max(
        estimateWidth(column.headerName) + 96,
        ...workingRows.map((row) =>
          estimateWidth(format(row, column, workingColumns)),
        ),
      );
      columnWidths.set(column.id, width);
      emit("columnResized", { columnId: column.id, width });
      render();
    };

    const pinColumn = (
      column: Column<RowRecord>,
      pinned: "left" | "right" | null,
    ) => {
      column.pinned = pinned ?? undefined;
      emit("columnPinned", { columnId: column.id, pinned });
      render();
    };

    const pinnedStyle = (
      column: Column<RowRecord>,
      columns: Column<RowRecord>[],
    ) => {
      if (!column.pinned) return "";
      const index = columns.findIndex((entry) => entry.id === column.id);
      const width = (entry: Column<RowRecord>) => columnWidth(entry);
      const offset =
        column.pinned === "left"
          ? columns
              .slice(0, index)
              .filter((entry) => entry.pinned === "left")
              .reduce((sum, entry) => sum + width(entry), 0)
          : columns
              .slice(index + 1)
              .filter((entry) => entry.pinned === "right")
              .reduce((sum, entry) => sum + width(entry), 0);
      return `position:sticky;${column.pinned}:${offset}px;z-index:3;background:var(--gnx-pinned-bg,var(--gnx-bg));box-shadow:${column.pinned === "left" ? "inset -1px 0 0 var(--gnx-border)" : "inset 1px 0 0 var(--gnx-border)"};`;
    };

    const columnWidth = (column: Column<RowRecord>) => {
      const explicit = columnWidths.get(column.id) ?? column.width;
      if (explicit != null) return explicit;
      const contentWidth = workingRows
        .slice(0, 100)
        .reduce(
          (max, row) =>
            Math.max(max, estimateWidth(format(row, column, workingColumns))),
          estimateWidth(column.headerName) + 72,
        );

      return Math.min(
        column.maxWidth ?? 1000,
        Math.max(column.minWidth ?? 72, contentWidth),
      );
    };

    const fillWidthColumnIds = (columns: Column<RowRecord>[]) => {
      const fillWidth = effectiveFillWidth();
      const fillWidthEnabled =
        fillWidth === true ||
        (typeof fillWidth === "object" && fillWidth?.enabled !== false);
      if (!fillWidthEnabled || !columns.length) return new Set<string>();
      const mode =
        typeof fillWidth === "object" ? fillWidth.mode : undefined;
      const fillableColumns = columns.filter((entry) => !entry.pinned);
      if (!fillableColumns.length) return new Set<string>();
      const flexColumns = fillableColumns.filter((entry) => (entry.flex ?? 0) > 0);
      const hasConfiguredWidths = fillableColumns.some(
        (entry) =>
          columnWidths.has(entry.id) ||
          entry.width != null ||
          (entry.flex ?? 0) > 0,
      );
      if (!hasConfiguredWidths)
        return new Set(fillableColumns.map((entry) => entry.id));
      if (mode !== "lastColumn" && flexColumns.length) {
        return new Set(flexColumns.map((entry) => entry.id));
      }
      if (
        mode === "lastColumn" ||
        mode === "flexOrLast" ||
        mode == null
      ) {
        return new Set([fillableColumns[fillableColumns.length - 1].id]);
      }
      return new Set<string>();
    };

    const tableMinimumWidth = (columns: Column<RowRecord>[]) =>
      (effectiveCheckboxSelection() ? 44 : 0) +
      (effectiveRowNumbers() ? 72 : 0) +
      columns.reduce((total, column) => total + columnWidth(column), 0);

    const headerIcon = (name: "sort" | "filter" | "menu") => {
      if (name === "filter")
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>';
      if (name === "menu")
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>';
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h8"/><path d="M8 12h6"/><path d="M8 17h4"/><path d="M18 6v12"/><path d="m15 15 3 3 3-3"/></svg>';
    };

    const positionHeaderPopover = (
      anchor: HTMLElement,
      width: number,
      type: "filter" | "menu",
      columnId: string,
    ) => {
      if (headerPopover?.type === type && headerPopover.columnId === columnId) {
        headerPopover = null;
        return;
      }
      const rect = anchor.getBoundingClientRect();
      headerPopover = {
        type,
        columnId,
        x: Math.max(
          8,
          Math.min(rect.right - width, window.innerWidth - width - 8),
        ),
        y: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 96)),
      };
    };

    const download = (
      columns: Column<RowRecord>[],
      rows: RowRecord[],
      excel = false,
    ) => {
      const content = excel
        ? `<table><tr>${columns.map((column) => `<th>${column.headerName}</th>`).join("")}</tr>${rows.map((row) => `<tr>${columns.map((column) => `<td>${format(row, column, workingColumns)}</td>`).join("")}</tr>`).join("")}</table>`
        : [
            columns
              .map((column) => JSON.stringify(column.headerName))
              .join(","),
            ...rows.map((row) =>
              columns
                .map((column) =>
                  JSON.stringify(format(row, column, workingColumns)),
                )
                .join(","),
            ),
          ].join("\n");
      const blob = new Blob([content], {
        type: excel ? "application/vnd.ms-excel" : "text/csv;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = excel ? "gridnexa-export.xls" : "gridnexa-export.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const render = () => {
      if (!host.value) return;
      if (!props.unstyled) injectGridNexaRuntimeStyles();
      const sourceRows = visibleRows();
      const pivot = buildPivot(
        sourceRows,
        workingColumns,
        props.groupBy,
        props.pivotBy,
        props.pivotValueColumns,
        props.pivotAggregation,
      );
      const columns = pivot.columns
        .filter((column) => !column.hidden && !hiddenColumnIds.has(column.id))
        .sort(
          (left, right) =>
            (left.pinned === "left" ? 0 : left.pinned === "right" ? 2 : 1) -
            (right.pinned === "left" ? 0 : right.pinned === "right" ? 2 : 1),
        );
      const pageSize = effectivePageSize();
      const pageRows = pageSize
        ? pivot.rows.slice(
            pageIndex.value * pageSize,
            pageIndex.value * pageSize + pageSize,
          )
        : pivot.rows;
      const displayRows = pivot.active
        ? pageRows.map((row) => ({
            kind: "data" as const,
            row,
            rowIndex: pivot.rows.indexOf(row),
          }))
        : makeDisplayRows(pageRows);
      const root = document.createElement("div");
      root.className = ["sg-shell", "gridnexa-vue-grid", props.className]
        .filter(Boolean)
        .join(" ");
      root.dataset.gnxTheme = props.theme ?? "dark";
      root.dataset.gnxDensity = props.density ?? "standard";
      if (props.height != null)
        root.style.height =
          typeof props.height === "number" ? `${props.height}px` : props.height;
      root.style.position = "relative";
      root.addEventListener("click", () => {
        if (headerPopover) {
          headerPopover = null;
          render();
        }
      });

      const toolbar = renderToolbar(columns, pivot.rows);
      if (toolbar) {
        toolbar.classList.add("sg-toolbar");
        root.appendChild(toolbar);
      }

      const workspace = document.createElement("div");
      workspace.className = "sg-grid-workspace";
      const gridRoot = renderTable(columns, displayRows);
      workspace.appendChild(gridRoot);
      root.appendChild(workspace);

      const overlay = renderOverlay(displayRows.length);
      if (overlay) gridRoot.appendChild(overlay);

      const status = renderStatus(pivot.rows.length);
      if (status instanceof HTMLElement) {
        status.classList.add("sg-status-bar");
        status.setAttribute("role", "status");
      }
      root.appendChild(status);

      if (contextMenu) root.appendChild(renderContextMenu());
      if (headerPopover) root.appendChild(renderHeaderPopover());
      host.value.replaceChildren(root);
      emit("serverSideOperation", {
        sortModel: sortState ? [sortState] : [],
        filterModel: localColumnFilters,
        advancedFilterModel: props.advancedFilterModel,
        selectedRowIds: Array.from(selected),
        pageIndex: pageIndex.value,
        pageSize,
        groupBy: props.groupBy,
        pivotBy: props.pivotBy,
        pivotValueColumns: props.pivotValueColumns,
        pivotAggregation: props.pivotAggregation,
        treeData: Boolean(props.getTreeDataPath),
        masterDetail: Boolean(props.masterDetailRenderer),
      } satisfies ServerSideOperationState<RowRecord>);
      schedulePersistState();
    };

    const renderOverlay = (displayRowCount: number) => {
      const currentError = props.error as unknown;
      const hasError = currentError != null && currentError !== false;
      const isEmpty = !props.loading && !hasError && displayRowCount === 0;
      if (!props.loading && !hasError && !isEmpty) return null;
      const overlay = document.createElement("div");
      overlay.className = "sg-grid-overlay";
      overlay.style.cssText =
        "position:absolute;inset:48px 0 0;z-index:5;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb,var(--gnx-bg) 74%,transparent);backdrop-filter:blur(3px);pointer-events:none";
      const card = document.createElement("div");
      card.className = "sg-grid-overlay-card";
      card.style.cssText = `max-width:min(420px,calc(100% - 32px));padding:18px 20px;border:1px solid ${hasError ? "rgba(220,38,38,.24)" : "var(--gnx-border)"};border-radius:14px;background:var(--gnx-panel);color:${hasError ? "#991b1b" : "var(--gnx-heading)"};box-shadow:var(--gnx-shadow);font-weight:800;text-align:center`;
      card.textContent = props.loading
        ? "Loading data..."
        : hasError
          ? currentError instanceof Error
            ? currentError.message
            : typeof currentError === "string"
              ? currentError
              : "Something went wrong while loading the grid."
          : typeof props.emptyState === "string"
            ? props.emptyState
            : props.emptyState == null
              ? "No rows to display"
              : String(props.emptyState);
      overlay.appendChild(card);
      return overlay;
    };

    const renderToolbar = (columns: Column<RowRecord>[], rows: RowRecord[]) => {
      const toolbarConfig = effectiveToolbar();
      const defaults =
        typeof toolbarConfig === "object"
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
              saveAll: true,
              addRow: false,
              deleteRow: false,
              deleteSelectedRows: false,
              ai: true,
            };
      const raw = {
        ...defaults,
        ...(typeof toolbarConfig === "object" ? toolbarConfig : {}),
      };
      const toolbarOptions = {
        ...raw,
        pagination: raw.pagination || raw.prevNextPage,
        fillHandle: raw.fillHandle || raw.fill,
        columns: raw.columns || raw.columnSelector,
      };
      if (
        toolbarConfig === false ||
        !Object.values(toolbarOptions).some(Boolean)
      )
        return null;
      const toolbar = document.createElement("div");
      toolbar.style.cssText =
        "display:flex;gap:8px;justify-content:space-between;align-items:center;padding:10px;background:var(--gnx-panel);border:1px solid var(--gnx-border)";
      if (toolbarOptions.summary) toolbar.append(`${rows.length} rows`);
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
      const aiEnabled =
        props.ai?.enabled ?? Boolean(props.ai?.provider || props.ai?.endpoint);
      if (toolbarOptions.ai && aiEnabled)
        toolbar.appendChild(renderAiCommand());
      const find = document.createElement("input");
      find.type = "search";
      find.placeholder = "Find cell";
      find.value = findText;
      find.style.cssText =
        "min-height:32px;padding:0 10px;border:1px solid var(--gnx-border);border-radius:8px;background:var(--gnx-panel-strong);color:var(--gnx-text)";
      find.addEventListener("input", () => {
        findText = find.value;
        render();
      });
      const quickFilter = document.createElement("input");
      quickFilter.type = "search";
      quickFilter.placeholder = "Quick filter";
      quickFilter.value = localQuickFilterText;
      quickFilter.style.cssText =
        "min-height:32px;padding:0 10px;border:1px solid var(--gnx-border);border-radius:8px;background:var(--gnx-panel-strong);color:var(--gnx-text)";
      quickFilter.addEventListener("input", () => {
        localQuickFilterText = quickFilter.value;
        pageIndex.value = 0;
        render();
      });
      const pageSize = effectivePageSize();
      const pageCount = pageSize
        ? Math.max(1, Math.ceil(rows.length / pageSize))
        : 1;
      if (toolbarOptions.pagination && pageSize) {
        const prev = button("Prev", () => {
          pageIndex.value = Math.max(0, pageIndex.value - 1);
          render();
        });
        prev.disabled = pageIndex.value <= 0;
        const next = button("Next", () => {
          pageIndex.value = Math.min(pageCount - 1, pageIndex.value + 1);
          render();
        });
        next.disabled = pageIndex.value >= pageCount - 1;
        actions.append(prev, ` Page ${pageIndex.value + 1} `, next);
      }
      if (toolbarOptions.quickFilter) actions.appendChild(quickFilter);
      if (toolbarOptions.find) actions.appendChild(find);
      if (toolbarOptions.undoRedo && effectiveUndoRedo()) {
        const undoButton = button("Undo", undo);
        undoButton.disabled = !undoStack.length;
        const redoButton = button("Redo", redo);
        redoButton.disabled = !redoStack.length;
        actions.append(undoButton, redoButton);
      }
      if (toolbarOptions.fillHandle && effectiveFillHandle())
        actions.appendChild(button("Fill", fillDown));
      if (toolbarOptions.addRow)
        actions.appendChild(button("Add row", () => addRow()));
      if (toolbarOptions.deleteRow)
        actions.appendChild(
          button("Delete row", () => deleteRow(activeCell?.rowIndex ?? 0)),
        );
      if (toolbarOptions.deleteSelectedRows)
        actions.appendChild(button("Delete selected", deleteSelectedRows));
      if (
        toolbarOptions.columns ||
        toolbarOptions.filters ||
        toolbarOptions.advancedFilter
      ) {
        const toolsButton = button(
          toolsOpen ? "Hide tools" : "Tools",
          () => undefined,
        );
        toolsButton.addEventListener("click", () => {
          toolsOpen = !toolsOpen;
          render();
        });
        actions.appendChild(toolsButton);
        if (toolsOpen) actions.appendChild(renderToolsPanel());
      }
      if (toolbarOptions.saveAll)
        actions.appendChild(button("Save all", () => saveAllRows("toolbar")));
      if (toolbarOptions.exportCsv)
        actions.appendChild(
          button("Export CSV", () => download(columns, rows)),
        );
      if (toolbarOptions.exportExcel)
        actions.appendChild(
          button("Export Excel", () => download(columns, rows, true)),
        );
      toolbar.appendChild(actions);
      return toolbar;
    };

    const renderAiCommand = () => {
      const shell = document.createElement("div");
      shell.style.cssText =
        "display:flex;gap:8px;align-items:end;flex-wrap:wrap";
      const input = document.createElement("input");
      input.placeholder =
        props.ai?.placeholder ??
        "Ask AI to filter, sort, group, pivot, pin, or export";
      input.value = aiPrompt;
      input.style.cssText =
        "min-height:32px;min-width:280px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
      input.addEventListener("input", () => {
        aiPrompt = input.value;
      });
      const ask = button(
        aiBusy ? "Thinking" : "Ask AI",
        () => void requestAiPlan(),
      );
      ask.disabled = aiBusy;
      shell.append(input, ask);
      if (aiError) shell.append(` ${aiError}`);
      if (aiPlan) {
        shell.append(
          ` ${aiPlan.title} `,
          button("Dismiss", () => {
            aiPlan = null;
            render();
          }),
          button(`Apply ${aiPlan.actions.length}`, () => applyAiPlan(aiPlan!)),
        );
      }
      return shell;
    };

    const renderTable = (columns: Column<RowRecord>[], rows: DisplayRow[]) => {
      const fillWidth = effectiveFillWidth();
      const fillWidthEnabled =
        fillWidth === true ||
        (typeof fillWidth === "object" && fillWidth?.enabled !== false);
      const viewport = document.createElement("div");
      viewport.className = "sg-grid-root";
      const table = document.createElement("table");
      table.className = "sg-grid-table";
      table.dataset.gnxFillWidth = String(fillWidthEnabled);
      const thead = document.createElement("thead");
      thead.className = "sg-header";
      const checkboxSelection = effectiveCheckboxSelection();
      const rowNumbers = effectiveRowNumbers();
      const leading = Number(checkboxSelection) + Number(rowNumbers);
      const minTableWidth = tableMinimumWidth(columns);
      table.style.cssText = fillWidthEnabled
        ? `width:max(100%,${minTableWidth}px);min-width:${minTableWidth}px`
        : `width:${minTableWidth}px;min-width:${minTableWidth}px`;
      const fillColumnIds = fillWidthColumnIds(columns);
      const colgroup = document.createElement("colgroup");
      if (checkboxSelection) {
        const selectionCol = document.createElement("col");
        selectionCol.style.width = "44px";
        colgroup.appendChild(selectionCol);
      }
      if (rowNumbers) {
        const rowNumberCol = document.createElement("col");
        rowNumberCol.style.width = "72px";
        colgroup.appendChild(rowNumberCol);
      }
      columns.forEach((column) => {
        const col = document.createElement("col");
        col.style.width = fillColumnIds.has(column.id)
          ? "auto"
          : `${columnWidth(column)}px`;
        col.style.minWidth = `${columnWidth(column)}px`;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);
      if (props.mergedHeaders?.length)
        thead.appendChild(renderMergedHeaders(columns, leading));
      const header = document.createElement("tr");
      header.className = "sg-column-header-row";
      if (checkboxSelection) {
        const selectionHeader = cell("", "th");
        selectionHeader.className = "sg-header-cell sg-selection-header";
        header.appendChild(selectionHeader);
      }
      if (rowNumbers) {
        const rowNumberHeader = cell("#", "th");
        rowNumberHeader.className = "sg-header-cell sg-row-number-header";
        header.appendChild(rowNumberHeader);
      }
      columns.forEach((column, columnIndex) => {
        const tools = resolveToolOptions(props.columnTools, column);
        const th = cell(
          `${column.headerName}${sortState?.columnId === column.id ? (sortState.direction === "asc" ? " ↑" : " ↓") : ""}`,
          "th",
        );
        th.style.cssText = `${fillColumnIds.has(column.id) ? "" : `width:${columnWidth(column)}px;`}min-width:${columnWidth(column)}px;${pinnedStyle(column, columns)}`;
        th.className = classNameList(
          "sg-header-cell",
          props.classNames?.headerCell,
          typeof column.headerClassName === "function"
            ? column.headerClassName({ column })
            : column.headerClassName,
          props.getHeaderClassName?.({ column, columnIndex }),
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
        const addHeaderButton = (
          icon: "sort" | "filter" | "menu",
          title: string,
          onClick: (event: MouseEvent, button: HTMLButtonElement) => void,
        ) => {
          const action = document.createElement("button");
          action.type = "button";
          action.className = "sg-header-icon-button";
          action.title = title;
          action.setAttribute("aria-label", title);
          action.innerHTML = headerIcon(icon);
          action.addEventListener("click", (event) => {
            event.stopPropagation();
            onClick(event, action);
          });
          actions.appendChild(action);
        };
        if (tools.sort)
          addHeaderButton("sort", `Sort ${column.headerName}`, () => {
            sortState =
              sortState?.columnId !== column.id
                ? { columnId: column.id, direction: "asc" }
                : sortState.direction === "asc"
                  ? { columnId: column.id, direction: "desc" }
                  : null;
            emit("sortChanged", sortState ? [sortState] : []);
            render();
          });
        if (tools.filter || tools.filterPanel)
          addHeaderButton("filter", `Add filter for ${column.headerName}`, (_event, button) => {
            positionHeaderPopover(button, 300, "filter", column.id);
            render();
          });
        if (tools.menu)
          addHeaderButton("menu", `Column menu for ${column.headerName}`, (_event, button) => {
            positionHeaderPopover(button, 240, "menu", column.id);
            render();
          });
        main.append(dragHandle, label);
        content.append(main, actions);
        th.appendChild(content);
        th.draggable = Boolean(tools.menu);
        th.addEventListener("dragstart", () => {
          draggedColumnId = column.id;
        });
        th.addEventListener("dragover", (event) => event.preventDefault());
        th.addEventListener("drop", (event) => {
          event.preventDefault();
          if (draggedColumnId) moveColumn(draggedColumnId, column.id);
          draggedColumnId = null;
        });
        th.addEventListener("click", () => {
          if (!tools.sort || column.sortable === false) return;
          sortState =
            sortState?.columnId !== column.id
              ? { columnId: column.id, direction: "asc" }
              : sortState.direction === "asc"
                ? { columnId: column.id, direction: "desc" }
                : null;
          emit("sortChanged", sortState ? [sortState] : []);
          render();
        });
        if (tools.resize && column.resizable !== false) {
          const resizer = document.createElement("span");
          resizer.className = "sg-resize-handle";
          resizer.addEventListener("mousedown", (event) =>
            startColumnResize(event, column),
          );
          th.appendChild(resizer);
        }
        header.appendChild(th);
      });
      thead.appendChild(header);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      rows.forEach((entry) => {
        if (entry.kind === "group")
          appendGroupRow(tbody, entry, columns.length + leading);
        if (entry.kind === "data") {
          appendRow(tbody, entry.row, entry.rowIndex, columns, leading, entry);
          const id = rowId(entry.row, entry.rowIndex);
          if (props.masterDetailRenderer && expandedDetailIds.has(id))
            appendDetailRow(tbody, entry.row, columns.length + leading);
        }
      });
      table.appendChild(tbody);
      viewport.appendChild(table);
      return viewport;
    };

    const renderMergedHeaders = (
      columns: Column<RowRecord>[],
      leading: number,
    ) => {
      const row = document.createElement("tr");
      row.className = "sg-merged-header-row";
      if (leading) {
        const spacer = cell("", "th");
        spacer.className = "sg-merged-header-cell";
        spacer.colSpan = leading;
        row.appendChild(spacer);
      }
      (props.mergedHeaders ?? []).forEach((header) => {
        const count = header.columnIds.filter((columnId) =>
          columns.some((column) => column.id === columnId),
        ).length;
        if (!count) return;
        const th = cell(header.headerName, "th");
        th.className = "sg-merged-header-cell";
        th.colSpan = count;
        th.style.cssText =
          "padding:8px;border:1px solid var(--gnx-border);background:var(--gnx-header-bg);text-align:center";
        row.appendChild(th);
      });
      return row;
    };

    const appendGroupRow = (
      tbody: HTMLTableSectionElement,
      entry: Extract<DisplayRow, { kind: "group" }>,
      colSpan: number,
    ) => {
      const tr = document.createElement("tr");
      tr.className = "sg-row sg-row--group";
      const td = document.createElement("td");
      td.className = "sg-cell sg-group-label";
      td.colSpan = colSpan;
      td.style.cssText =
        "padding:10px;border:1px solid var(--gnx-border);background:var(--gnx-panel-strong);color:var(--gnx-heading);font-weight:800;text-transform:uppercase";
      const toggle = button(collapsedGroups.has(entry.key) ? "+" : "-", () => {
        collapsedGroups.has(entry.key)
          ? collapsedGroups.delete(entry.key)
          : collapsedGroups.add(entry.key);
        render();
      });
      td.append(
        toggle,
        `${entry.label}  ${entry.rows.length} rows${entry.summaries ? `  ${entry.summaries}` : ""}`,
      );
      tr.appendChild(td);
      tbody.appendChild(tr);
    };

    const appendDetailRow = (
      tbody: HTMLTableSectionElement,
      row: RowRecord,
      colSpan: number,
    ) => {
      const detailRow = document.createElement("tr");
      detailRow.className = "sg-row sg-detail-row";
      const detail = document.createElement("td");
      detail.className = "sg-cell sg-detail-content";
      detail.colSpan = colSpan;
      detail.style.cssText =
        "padding:12px;border:1px solid var(--gnx-border);background:var(--gnx-panel-strong);color:var(--gnx-text)";
      const content = props.masterDetailRenderer?.(row);
      content instanceof Node
        ? detail.appendChild(content)
        : (detail.textContent = String(content ?? ""));
      detailRow.appendChild(detail);
      tbody.appendChild(detailRow);
    };

    const appendRow = (
      tbody: HTMLTableSectionElement,
      row: RowRecord,
      rowIndex: number,
      columns: Column<RowRecord>[],
      leading: number,
      display?: Extract<DisplayRow, { kind: "data" }>,
    ) => {
      const tr = document.createElement("tr");
      const rowSelected = selected.has(rowId(row, rowIndex));
      tr.className = classNameList(
        "sg-row",
        props.classNames?.row,
        props.getRowClassName?.({ row, rowIndex, selected: rowSelected }),
      );
      const currentPageSize = effectivePageSize();
      const displayRowNumber =
        (currentPageSize && currentPageSize > 0
          ? pageIndex.value * currentPageSize
          : 0) +
        rowIndex +
        1;
      tr.draggable = effectiveRowReorder();
      tr.addEventListener("dragstart", () => {
        if (!effectiveRowReorder()) return;
        draggedRowIndex = rowIndex;
      });
      tr.addEventListener("dragover", (event) => {
        if (effectiveRowReorder()) event.preventDefault();
      });
      tr.addEventListener("drop", (event) => {
        if (!effectiveRowReorder()) return;
        event.preventDefault();
        if (draggedRowIndex != null) reorderRow(draggedRowIndex, rowIndex);
        draggedRowIndex = null;
      });
      if (effectiveCheckboxSelection()) {
        const td = document.createElement("td");
        td.className = "sg-cell sg-selection-cell";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selected.has(rowId(row, rowIndex));
        checkbox.addEventListener("change", () => {
          checkbox.checked
            ? selected.add(rowId(row, rowIndex))
            : selected.delete(rowId(row, rowIndex));
          const selectedRows = props.rows.filter((entry, index) =>
            selected.has(rowId(entry, index)),
          );
          emit("rowSelectionChange", selectedRows);
          emit("selectionChanged", {
            selectedRows,
            selectedRowIds: Array.from(selected),
          });
          emit("rowSelected", {
            row,
            rowIndex,
            selected: checkbox.checked,
            selectedRows,
          });
          render();
        });
        td.appendChild(checkbox);
        tr.appendChild(td);
      }
      if (effectiveRowNumbers()) {
        const rowNumber = cell(String(displayRowNumber));
        rowNumber.className = "sg-cell sg-row-number";
        if (effectiveRowReorder()) {
          const tools = document.createElement("span");
          tools.className = "sg-row-tools";
          const up = button("↑", () => moveRow(rowIndex, -1));
          up.disabled = rowIndex <= 0;
          const down = button("↓", () => moveRow(rowIndex, 1));
          down.disabled = rowIndex >= workingRows.length - 1;
          tools.append(up, down);
          rowNumber.appendChild(tools);
        }
        tr.appendChild(rowNumber);
      }
      columns.forEach((column, columnIndex) => {
        const cellValue = value(row, column, workingColumns);
        const td = cell(format(row, column, workingColumns));
        const textOptions = resolveTextDisplay(props.textDisplay, column);
        td.className = classNameList(
          "sg-cell",
          props.classNames?.cell,
          resolveClassName(column.className, {
            value: cellValue,
            row,
            rowIndex,
            column,
          }),
          resolveClassName(column.cellClassName, {
            value: cellValue,
            row,
            rowIndex,
            column,
          }),
          props.getCellClassName?.({
            value: cellValue,
            row,
            rowIndex,
            column,
            columnIndex,
            selected: rowSelected,
          }),
        );
        const isFillColumn = fillWidthColumnIds(columns).has(column.id);
        td.style.cssText = `padding:10px;border:1px solid var(--gnx-border);${isFillColumn ? "" : `width:${columnWidth(column)}px;`}min-width:${columnWidth(column)}px;white-space:${textOptions.overflow === "wrap" ? "normal" : "nowrap"};overflow:hidden;text-overflow:${textOptions.overflow === "clip" ? "clip" : "ellipsis"};${pinnedStyle(column, columns)}`;
        if (
          textOptions.overflow === "ellipsis" &&
          textOptions.showTooltip !== false
        )
          td.title = format(row, column, workingColumns);
        if (
          activeCell?.rowIndex === rowIndex &&
          activeCell.columnId === column.id
        ) {
          td.style.outline = "2px solid #2563eb";
          td.style.outlineOffset = "-2px";
        }
        if (isCellInRange(rowIndex, column.id, columns))
          td.style.background = "rgba(37,99,235,.12)";
        if (
          findText &&
          format(row, column, workingColumns)
            .toLowerCase()
            .includes(findText.toLowerCase())
        ) {
          td.style.background = "rgba(37,99,235,.1)";
        }
        if (props.getTreeDataPath && columnIndex === 0) {
          td.style.paddingLeft = `${12 + (display?.depth ?? Math.max(0, props.getTreeDataPath(row).length - 1)) * 24}px`;
          if (display?.hasChildren && display.treeKey) {
            const treeKey = display.treeKey;
            const toggle = button(
              collapsedTreeKeys.has(treeKey) ? "+" : "-",
              () => {
                collapsedTreeKeys.has(treeKey)
                  ? collapsedTreeKeys.delete(treeKey)
                  : collapsedTreeKeys.add(treeKey);
                render();
              },
            );
            td.prepend(toggle);
          }
        } else if (props.masterDetailRenderer && columnIndex === 0) {
          const id = rowId(row, rowIndex);
          const toggle = button(expandedDetailIds.has(id) ? "-" : "+", () => {
            expandedDetailIds.has(id)
              ? expandedDetailIds.delete(id)
              : expandedDetailIds.add(id);
            render();
          });
          td.prepend(toggle);
        }
        td.addEventListener("click", (event) => {
          contextMenu = null;
          activeCell = { rowIndex, columnId: column.id };
          if (event.shiftKey && rangeAnchor) {
            rangeEnd = { rowIndex, columnId: column.id };
          } else {
            rangeAnchor = { rowIndex, columnId: column.id };
            rangeEnd = { rowIndex, columnId: column.id };
          }
          emit("selectedRowChange", {
            row,
            rowIndex,
            selectedRows: props.rows.filter((entry, index) =>
              selected.has(rowId(entry, index)),
            ),
          });
          emit("cellClick", { row, rowIndex, column });
          render();
        });
        td.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          activeCell = { rowIndex, columnId: column.id };
          contextMenu = {
            x: event.clientX,
            y: event.clientY,
            rowIndex,
            columnId: column.id,
          };
          render();
        });
        td.addEventListener("dblclick", () => {
          emit("cellDoubleClick", { row, rowIndex, column });
          if (column.editable) editCell(td, row, rowIndex, column);
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    };

    const editCell = (
      td: HTMLTableCellElement,
      row: RowRecord,
      rowIndex: number,
      column: Column<RowRecord>,
    ) => {
      const oldValue = rawValue(row, column);
      const input = createEditor(column, oldValue);
      emit("cellEditStart", { row, rowIndex, column, value: oldValue });
      td.replaceChildren(input);
      input.focus();
      input.addEventListener(
        "blur",
        () => {
          const newValue =
            input instanceof HTMLInputElement && input.type === "checkbox"
              ? input.checked
              : input.value;
          setCellValue(row, rowIndex, column, newValue);
          render();
        },
        { once: true },
      );
    };

    const createEditor = (column: Column<RowRecord>, current: unknown) => {
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
      if (
        editor &&
        typeof editor === "object" &&
        (editor.type === "select" || editor.type === "advancedSelect")
      ) {
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
    };

    const renderContextMenu = () => {
      const menu = document.createElement("div");
      menu.style.cssText = `position:fixed;z-index:9999;left:${contextMenu?.x ?? 0}px;top:${contextMenu?.y ?? 0}px;display:grid;min-width:150px;padding:6px;border:1px solid #dbe3ef;border-radius:10px;background:white;box-shadow:0 18px 48px rgba(15,23,42,.18)`;
      const row = contextMenu ? workingRows[contextMenu.rowIndex] : undefined;
      const column = workingColumns.find(
        (entry) => entry.id === contextMenu?.columnId,
      );
      menu.append(
        button("Copy", () => void copyActiveCell()),
        button("Paste", () => void pasteActiveCell()),
        button("Edit cell", () => {
          if (!row || !column || column.editable === false || !contextMenu)
            return;
          const nextValue = window.prompt(
            `Edit ${column.headerName}`,
            String(rawValue(row, column) ?? ""),
          );
          if (nextValue != null)
            setCellValue(row, contextMenu.rowIndex, column, nextValue);
          contextMenu = null;
          render();
        }),
        button("Clear cell", () => {
          if (row && column && column.editable !== false && contextMenu)
            setCellValue(row, contextMenu.rowIndex, column, "");
          contextMenu = null;
          render();
        }),
        button("Hide column", () => {
          if (column) hiddenColumnIds.add(column.id);
          contextMenu = null;
          render();
        }),
      );
      return menu;
    };

    const renderHeaderPopover = () => {
      const popover = headerPopover;
      const column = workingColumns.find(
        (entry) => entry.id === popover?.columnId,
      );
      const panel = document.createElement("div");
      panel.className =
        popover?.type === "filter"
          ? "sg-header-menu sg-column-filter-popover"
          : "sg-header-menu";
      panel.style.cssText = `position:fixed;left:${popover?.x ?? 0}px;top:${popover?.y ?? 0}px;z-index:10050`;
      panel.addEventListener("click", (event) => event.stopPropagation());
      if (!popover || !column) return panel;
      const popoverButton = (label: string, className: string, run: () => void) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = className;
        item.textContent = label;
        item.addEventListener("click", run);
        return item;
      };

      if (popover.type === "filter") {
        const title = document.createElement("div");
        title.className = "sg-column-filter-title";
        title.textContent = column.headerName;
        const current = localColumnFilters[column.id] ?? {
          operator: "contains",
          value: "",
        };
        const operator = document.createElement("select");
        operator.className = "sg-column-filter-input";
        ["contains", "equals", "startsWith", "endsWith", "gt", "gte", "lt", "lte", "blank", "notBlank"].forEach(
          (entry) => {
            const option = document.createElement("option");
            option.value = entry;
            option.textContent = entry;
            operator.appendChild(option);
          },
        );
        operator.value = current.operator ?? "contains";
        const input = document.createElement("input");
        input.className = "sg-column-filter-input";
        input.placeholder = "Filter value";
        input.value = String(current.value ?? "");
        const actions = document.createElement("div");
        actions.className = "sg-column-filter-actions";
        const apply = popoverButton("Apply", "sg-column-filter-button", () => {
          headerPopover = null;
          setColumnFilter(column.id, {
            ...current,
            operator: operator.value as ColumnFilterModel["operator"],
            value: input.value,
          });
        });
        const clear = popoverButton("Clear", "sg-column-filter-button", () => {
          headerPopover = null;
          setColumnFilter(column.id, null);
        });
        const done = popoverButton("Done", "sg-column-filter-button", () => {
          headerPopover = null;
          render();
        });
        actions.append(clear, apply, done);
        panel.append(title, operator, input, actions);
        return panel;
      }

      const menuAction = (label: string, run: () => void) => {
        const item = popoverButton(label, "sg-header-menu-item", () => {
          run();
          headerPopover = null;
          render();
        });
        return item;
      };
      panel.append(
        menuAction("Sort ascending", () => {
          sortState = { columnId: column.id, direction: "asc" };
          emit("sortChanged", [sortState]);
        }),
        menuAction("Sort descending", () => {
          sortState = { columnId: column.id, direction: "desc" };
          emit("sortChanged", [sortState]);
        }),
        menuAction("Clear sort", () => {
          sortState = null;
          emit("sortChanged", []);
        }),
        menuAction("Pin left", () => pinColumn(column, "left")),
        menuAction("Pin right", () => pinColumn(column, "right")),
        menuAction("Unpin", () => pinColumn(column, null)),
        menuAction("Auto-size", () => autoSizeColumn(column)),
        menuAction("Hide column", () => {
          hiddenColumnIds.add(column.id);
          emit("columnVisible", {
            columnId: column.id,
            visible: false,
            hiddenColumnIds: Array.from(hiddenColumnIds),
          });
        }),
      );
      return panel;
    };

    const renderToolsPanel = () => {
      const panel = document.createElement("div");
      panel.style.cssText = `flex:1 1 100%;z-index:10001;width:min(720px,calc(100vw - 24px));max-width:100%;max-height:min(620px,calc(100vh - 96px));overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:12px;border:1px solid #dbe3ef;border-radius:12px;background:#f8fbff;box-shadow:0 18px 48px rgba(15,23,42,.18)`;
      const columnsSection = document.createElement("section");
      columnsSection.appendChild(document.createElement("strong")).textContent =
        "Columns";
      workingColumns.forEach((column) => {
        const label = document.createElement("label");
        label.style.cssText =
          "display:flex;gap:8px;align-items:center;margin-top:6px";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !hiddenColumnIds.has(column.id);
        checkbox.addEventListener("change", () => {
          checkbox.checked
            ? hiddenColumnIds.delete(column.id)
            : hiddenColumnIds.add(column.id);
          render();
        });
        label.append(checkbox, column.headerName);
        columnsSection.appendChild(label);
      });

      const pivotSection = document.createElement("section");
      pivotSection.appendChild(document.createElement("strong")).textContent =
        "Pivot";
      pivotSection.append(
        select("Row group", props.groupBy, "No group", (value) =>
          emit("pivotModelChange", {
            groupBy: value,
            pivotBy: props.pivotBy,
            pivotValueColumns: props.pivotValueColumns ?? [],
            pivotAggregation: props.pivotAggregation,
          }),
        ),
        select("Pivot by", props.pivotBy, "Pivot off", (value) =>
          emit("pivotModelChange", {
            groupBy: props.groupBy,
            pivotBy: value,
            pivotValueColumns: props.pivotValueColumns ?? [],
            pivotAggregation: props.pivotAggregation,
          }),
        ),
        select("Value", props.pivotValueColumns?.[0], "No value", (value) =>
          emit("pivotModelChange", {
            groupBy: props.groupBy,
            pivotBy: props.pivotBy,
            pivotValueColumns: value ? [value] : [],
            pivotAggregation: props.pivotAggregation,
          }),
        ),
        select(
          "Aggregation",
          props.pivotAggregation,
          "",
          (value) =>
            emit("pivotModelChange", {
              groupBy: props.groupBy,
              pivotBy: props.pivotBy,
              pivotValueColumns: props.pivotValueColumns ?? [],
              pivotAggregation: value as PivotAggregation,
            }),
          ["sum", "avg", "count", "min", "max"],
        ),
      );

      const filterSection = document.createElement("section");
      filterSection.appendChild(document.createElement("strong")).textContent =
        "Advanced filter";
      const columnSelect = select(
        "",
        workingColumns[0]?.id,
        "",
        () => undefined,
        workingColumns.map((column) => column.id),
      );
      const operatorSelect = select("", "contains", "", () => undefined, [
        "contains",
        "equals",
        "gt",
        "gte",
        "lt",
        "lte",
        "blank",
        "notBlank",
      ]);
      const valueInput = document.createElement("input");
      valueInput.placeholder = "Value";
      valueInput.style.cssText =
        "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
      filterSection.append(
        columnSelect,
        operatorSelect,
        valueInput,
        button("Apply", () => {
          emit("advancedFilterModelChange", {
            kind: "group",
            joinOperator: "and",
            conditions: [
              {
                kind: "rule",
                columnId: (
                  columnSelect.querySelector("select") as HTMLSelectElement
                ).value,
                operator: (
                  operatorSelect.querySelector("select") as HTMLSelectElement
                ).value as ColumnFilterModel["operator"],
                value: valueInput.value,
              },
            ],
          } satisfies AdvancedFilterModel);
        }),
        button("Clear", () => emit("advancedFilterModelChange", null)),
      );

      panel.append(columnsSection, pivotSection, filterSection);
      return panel;
    };

    const select = (
      labelText: string,
      value: string | undefined,
      emptyLabel: string,
      onChange: (value: string | undefined) => void,
      fixedOptions?: string[],
    ) => {
      const label = document.createElement("label");
      label.style.cssText =
        "display:flex;gap:8px;align-items:center;margin-top:6px";
      if (labelText) label.append(`${labelText} `);
      const element = document.createElement("select");
      element.style.cssText =
        "min-height:32px;padding:0 8px;border:1px solid #bfdbfe;border-radius:8px";
      if (emptyLabel) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = emptyLabel;
        element.appendChild(option);
      }
      (
        fixedOptions ?? workingColumns.map((column) => String(column.field))
      ).forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry;
        option.textContent =
          workingColumns.find(
            (column) => column.id === entry || column.field === entry,
          )?.headerName ?? entry;
        element.appendChild(option);
      });
      element.value = value ?? "";
      element.addEventListener("change", () =>
        onChange(element.value || undefined),
      );
      label.appendChild(element);
      return label;
    };

    const renderStatus = (totalRows: number) => {
      const footer = effectiveFooter();
      if (footer === false) return document.createDocumentFragment();
      const columns = workingColumns.filter(
        (column) => !column.hidden && !hiddenColumnIds.has(column.id),
      );
      const visible = visibleRows();
      const summaryOptions = resolveSummaryOptions(props.summaries);
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
      status.style.cssText =
        "display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:10px;border:1px solid var(--gnx-border);border-top:0;font-weight:700";
      const state = {
        rowCountLabel: `${totalRows} rows`,
        selectedRowsLabel: `${selected.size} selected`,
        activeCellLabel: activeCell
          ? `Cell ${activeCell.rowIndex + 1}:${activeCell.columnId}`
          : "No cell",
        selectedRangeLabel:
          rangeAnchor && rangeEnd ? "Range selected" : "No range",
        summaryLabel: summaryOptions.footer
          ? buildSummaryLabel(
              visible.flatMap((row) =>
                columns.map((column) => value(row, column, workingColumns)),
              ),
              "No numeric values",
            )
          : "",
        selectedRangeSummaryLabel:
          summaryOptions.selectedRange && rangeAnchor && rangeEnd
            ? buildSummaryLabel(
                visible
                  .slice(
                    Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex),
                    Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex) + 1,
                  )
                  .flatMap((row) =>
                    columns
                      .slice(
                        Math.min(
                          columns.findIndex(
                            (column) => column.id === rangeAnchor?.columnId,
                          ),
                          columns.findIndex(
                            (column) => column.id === rangeEnd?.columnId,
                          ),
                        ),
                        Math.max(
                          columns.findIndex(
                            (column) => column.id === rangeAnchor?.columnId,
                          ),
                          columns.findIndex(
                            (column) => column.id === rangeEnd?.columnId,
                          ),
                        ) + 1,
                      )
                      .map((column) => value(row, column, workingColumns)),
                  ),
                "No numeric values in range",
              )
            : "",
        filterCountLabel: `${Object.keys(localColumnFilters).length + Number(Boolean(props.advancedFilterModel))} filters`,
        sortStatusLabel: sortState
          ? `Sorted ${sortState.direction}`
          : "Unsorted",
        pageIndex: pageIndex.value,
        pageCount: effectivePageSize()
          ? Math.max(1, Math.ceil(totalRows / effectivePageSize()!))
          : 1,
      };
      const renderer = typeof footer === "object" ? footer.renderer : undefined;
      if (typeof renderer === "function") {
        const content = renderer(state);
        content instanceof Node
          ? status.appendChild(content)
          : status.append(String(content ?? ""));
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
      if (summaryOptions.footer && state.summaryLabel)
        appendStatus(state.summaryLabel);
      if (summaryOptions.selectedRange && state.selectedRangeSummaryLabel)
        appendStatus(state.selectedRangeSummaryLabel);
      if (footerOptions.filterCount) appendStatus(state.filterCountLabel);
      if (footerOptions.selectedRange) appendStatus(state.selectedRangeLabel);
      const toolbar = effectiveToolbar();
      const paginationEnabled =
        toolbar === undefined ||
        toolbar === true ||
        (typeof toolbar === "object" &&
          Boolean(
            (toolbar as Record<string, boolean>).pagination ||
            (toolbar as Record<string, boolean>).prevNextPage,
          ));
      if (
        footerOptions.pagination &&
        paginationEnabled &&
        effectivePageSize()
      ) {
        const pageCount = state.pageCount;
        const pager = document.createElement("span");
        pager.style.marginLeft = "auto";
        const prev = button("Prev", () => {
          pageIndex.value = Math.max(0, pageIndex.value - 1);
          render();
        });
        prev.disabled = pageIndex.value <= 0;
        const next = button("Next", () => {
          pageIndex.value = Math.min(pageCount - 1, pageIndex.value + 1);
          render();
        });
        next.disabled = pageIndex.value >= pageCount - 1;
        pager.append(
          prev,
          ` Page ${pageIndex.value + 1} of ${pageCount} `,
          next,
        );
        status.appendChild(pager);
      }
      return status;
    };

    const button = (text: string, onClick: () => void) => {
      const element = document.createElement("button");
      element.type = "button";
      element.textContent = text;
      element.style.cssText =
        "min-height:32px;padding:0 10px;border:1px solid var(--gnx-border);border-radius:8px;background:var(--gnx-panel);color:var(--gnx-primary);font-weight:800";
      element.addEventListener("click", onClick);
      return element;
    };

    onMounted(() => {
      syncWorkingData();
      attachApi();
      render();
    });
    watch(
      () => ({ ...props }),
      () => {
        syncWorkingData();
        localQuickFilterText = props.quickFilterText;
        attachApi();
        render();
      },
      { deep: true },
    );

    return () => h("div", { ref: host, class: "gridnexa-vue-host" });
  },
});

export default GridNexaVue;
