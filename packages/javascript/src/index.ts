import type {
  AdvancedFilterModel,
  Column,
  ColumnFilterModel,
  GridOptions,
  MergedHeader,
  PivotAggregation,
} from "@gridnexa/core";

export * from "@gridnexa/core";

export interface GridNexaJavaScriptOptions<T = Record<string, unknown>>
  extends GridOptions<T> {
  pageSize?: number;
  groupBy?: keyof T & string;
  onCellClick?: (params: {
    row: T;
    rowIndex: number;
    column: Column<T>;
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

const styleId = "gridnexa-javascript-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .gnx-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;border:1px solid rgba(30,64,175,.16);border-radius:12px;background:#fff;color:#0f172a;font:14px/1.45 Inter,"Segoe UI",system-ui,sans-serif;overflow:hidden;box-shadow:0 18px 48px rgba(15,23,42,.12)}
    .gnx-main{min-width:0;overflow:auto}.gnx-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border-bottom:1px solid rgba(30,64,175,.12);background:#f8fbff}.gnx-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
    .gnx-button,.gnx-panel button{min-height:32px;padding:0 10px;border:1px solid rgba(30,64,175,.16);border-radius:8px;background:#fff;color:#1d4ed8;font:inherit;font-weight:800;cursor:pointer}.gnx-button:disabled{opacity:.48;cursor:not-allowed}
    .gnx-table{width:100%;min-width:max-content;border-collapse:separate;border-spacing:0}.gnx-table th,.gnx-table td{min-height:42px;padding:10px 12px;border-right:1px solid rgba(30,64,175,.11);border-bottom:1px solid rgba(30,64,175,.1);text-align:left;white-space:nowrap}
    .gnx-table th{position:sticky;top:0;z-index:1;background:#f8fbff;color:#172033;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;user-select:none}.gnx-table th[draggable=true]{cursor:grab}.gnx-table thead tr:first-child th{background:#e8f1ff;color:#153e90;text-align:center}.gnx-table tbody tr:hover td{background:rgba(37,99,235,.07)}
    .gnx-control{width:44px;text-align:center!important}.gnx-detail{background:#f8fbff;color:#334155}.gnx-empty{padding:18px;color:#64748b}.gnx-status{display:flex;gap:18px;flex-wrap:wrap;padding:10px 12px;border-top:1px solid rgba(30,64,175,.12);font-size:12px;font-weight:800;color:#334155;background:#fff}.gnx-find{min-height:32px;padding:0 9px;border:1px solid rgba(30,64,175,.16);border-radius:8px}.gnx-cell-active{outline:2px solid #2563eb;outline-offset:-2px;background:rgba(37,99,235,.08)!important}.gnx-row-tools{display:inline-flex;gap:3px}.gnx-row-tools button{min-height:24px;padding:0 5px;border:1px solid rgba(30,64,175,.14);border-radius:6px;background:#fff;color:#1d4ed8;font-weight:900}.gnx-drop-target{box-shadow:inset 3px 0 #2563eb}
    .gnx-side{display:flex;border-left:1px solid rgba(30,64,175,.14);background:#f8fbff}.gnx-tabs{display:grid;grid-auto-rows:116px;width:42px;background:#eef4ff}.gnx-tab{border:0;border-bottom:1px solid rgba(30,64,175,.12);background:transparent;color:#334155;cursor:pointer;font:inherit;font-weight:800;writing-mode:vertical-rl}.gnx-tab.active,.gnx-tab:hover{background:rgba(37,99,235,.1);color:#1d4ed8}
    .gnx-panel{width:min(340px,calc(100vw - 64px));max-height:620px;overflow:auto;padding:14px;background:#fff;box-shadow:-18px 0 42px rgba(15,23,42,.1)}.gnx-panel h3{margin:0 0 8px;font-size:14px}.gnx-section{display:grid;gap:8px;padding:12px 0;border-top:1px solid rgba(30,64,175,.12)}.gnx-panel label{display:flex;align-items:center;gap:8px;min-height:30px}.gnx-panel select,.gnx-panel input{min-height:34px;padding:0 9px;border:1px solid rgba(30,64,175,.16);border-radius:8px;background:#fff;color:#0f172a}.gnx-rule{display:grid;gap:8px;padding:10px;border:1px solid rgba(30,64,175,.12);border-radius:10px;background:#f8fbff}
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

function cell(text: string, tag: "td" | "th" = "td") {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

export class GridNexaGrid<T = Record<string, unknown>> {
  private options: GridNexaJavaScriptOptions<T>;
  private sortState: SortState = null;
  private selectedIds = new Set<string | number>();
  private pageIndex = 0;
  private sideOpen = false;
  private activeCell: CellPoint | null = null;
  private findText = "";
  private hiddenColumnIds = new Set<string>();
  private columnOrder: string[] = [];
  private draggedColumnId: string | null = null;
  private undoStack: Array<CellEdit<T>> = [];
  private redoStack: Array<CellEdit<T>> = [];

  constructor(private readonly container: HTMLElement, options: GridNexaJavaScriptOptions<T>) {
    this.options = options;
    this.columnOrder = options.columns.map((column) => column.id);
    this.hiddenColumnIds = new Set(options.columns.filter((column) => column.hidden).map((column) => column.id));
    injectStyles();
    this.applyTransaction();
    this.bindKeyboard();
    this.render();
  }

  update(options: Partial<GridNexaJavaScriptOptions<T>>) {
    this.options = { ...this.options, ...options };
    const knownColumns = new Set(this.columnOrder);
    this.options.columns.forEach((column) => {
      if (!knownColumns.has(column.id)) this.columnOrder.push(column.id);
      if (column.hidden) this.hiddenColumnIds.add(column.id);
    });
    this.applyTransaction();
    this.render();
  }

  destroy() {
    this.container.replaceChildren();
    this.selectedIds.clear();
  }

  private getRowId(row: T, index: number) {
    return this.options.getRowId?.(row, index) ?? index;
  }

  private effectiveColumns() {
    const columnsById = new Map(this.options.columns.map((column) => [column.id, column]));
    const ordered = [
      ...this.columnOrder.map((columnId) => columnsById.get(columnId)).filter((column): column is Column<T> => Boolean(column)),
      ...this.options.columns.filter((column) => !this.columnOrder.includes(column.id)),
    ];

    return ordered.filter((column) => !this.hiddenColumnIds.has(column.id));
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
    const row = this.options.rows[this.activeCell.rowIndex];
    const column = this.options.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (!row || !column) return;
    await navigator.clipboard?.writeText(formatValue(row, column, this.options.columns));
  }

  private async pasteActiveCell() {
    if (!this.activeCell || typeof navigator === "undefined") return;
    const row = this.options.rows[this.activeCell.rowIndex];
    const column = this.options.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (!row || !column || column.editable === false) return;
    const value = await navigator.clipboard?.readText();
    this.setCellValue(row, this.activeCell.rowIndex, column, value);
    this.render();
  }

  private fillDown() {
    if (!this.activeCell || this.options.enableFillHandle === false) return;
    const row = this.options.rows[this.activeCell.rowIndex];
    const nextRow = this.options.rows[this.activeCell.rowIndex + 1];
    const column = this.options.columns.find((entry) => entry.id === this.activeCell?.columnId);
    if (!row || !nextRow || !column || column.editable === false) return;
    this.setCellValue(nextRow, this.activeCell.rowIndex + 1, column, getValue(row, column));
    this.render();
  }

  private moveRow(rowIndex: number, direction: -1 | 1) {
    const nextIndex = rowIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.options.rows.length) return;
    const rows = [...this.options.rows];
    const [row] = rows.splice(rowIndex, 1);
    rows.splice(nextIndex, 0, row);
    this.options = { ...this.options, rows };
    this.render();
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
    this.render();
  }

  render() {
    const filteredRows = this.visibleRows();
    const pivot = buildPivot(this.options, filteredRows);
    const columns = pivot.columns === this.options.columns ? this.effectiveColumns() : pivot.columns.filter((column) => !column.hidden);
    const rows = this.pageRows(pivot.rows);
    const root = document.createElement("div");
    root.className = "gnx-grid";
    const main = document.createElement("div");
    main.className = "gnx-main";
    main.appendChild(this.renderToolbar(columns, pivot.rows));
    main.appendChild(this.renderTable(columns, rows));
    main.appendChild(this.renderStatus(pivot.rows.length));
    root.append(main, this.renderSidePanel());
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
    const toolbar = document.createElement("div");
    toolbar.className = "gnx-toolbar";
    const summary = document.createElement("span");
    summary.textContent = `${rows.length} rows`;
    const actions = document.createElement("div");
    actions.className = "gnx-actions";
    const find = document.createElement("input");
    find.className = "gnx-find";
    find.type = "search";
    find.placeholder = "Find cell";
    find.value = this.findText;
    find.addEventListener("input", () => {
      this.findText = find.value;
      this.render();
    });
    const pageCount = this.options.pageSize ? Math.max(1, Math.ceil(rows.length / this.options.pageSize)) : 1;
    if (this.options.pageSize) {
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
    actions.appendChild(find);
    if (this.options.enableUndoRedo !== false) {
      const undo = this.button("Undo", () => this.undo());
      undo.disabled = !this.undoStack.length;
      const redo = this.button("Redo", () => this.redo());
      redo.disabled = !this.redoStack.length;
      actions.append(undo, redo);
    }
    if (this.options.enableFillHandle !== false) {
      actions.appendChild(this.button("Fill", () => this.fillDown()));
    }
    actions.appendChild(this.button("Export CSV", () => this.exportCsv(columns, rows)));
    actions.appendChild(this.button("Export Excel", () => this.exportExcel(columns, rows)));
    toolbar.append(summary, actions);
    return toolbar;
  }

  private renderTable(columns: Column<T>[], rows: T[]) {
    const table = document.createElement("table");
    table.className = "gnx-table";
    const thead = document.createElement("thead");
    const leading = Number(this.options.checkboxSelection) + Number(this.options.rowNumbers);
    if (this.options.mergedHeaders?.length) thead.appendChild(this.renderMergedHeaders(columns, leading));
    const header = document.createElement("tr");
    if (this.options.checkboxSelection) header.appendChild(cell("", "th")).className = "gnx-control";
    if (this.options.rowNumbers) header.appendChild(cell("#", "th")).className = "gnx-control";
    columns.forEach((column) => {
      const th = cell(column.headerName, "th");
      if (column.width) th.style.width = `${column.width}px`;
      th.draggable = true;
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
        if (column.sortable === false) return;
        this.sortState = this.sortState?.columnId !== column.id ? { columnId: column.id, direction: "asc" } : this.sortState.direction === "asc" ? { columnId: column.id, direction: "desc" } : null;
        this.render();
      });
      header.appendChild(th);
    });
    thead.appendChild(header);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((row, rowIndex) => this.appendDataRow(tbody, row, rowIndex, columns, leading));
    table.appendChild(tbody);
    return table;
  }

  private renderStatus(totalRows: number) {
    const status = document.createElement("div");
    status.className = "gnx-status";
    status.append(
      `${totalRows} rows`,
      `${this.selectedIds.size} selected`,
      this.activeCell ? `Cell ${this.activeCell.rowIndex + 1}:${this.activeCell.columnId}` : "No cell",
      this.sortState ? `Sorted ${this.sortState.direction}` : "Unsorted",
      `${Object.keys(this.options.columnFilters ?? {}).length + Number(isAdvancedActive(this.options.advancedFilterModel))} filters`,
    );
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

  private appendDataRow(tbody: HTMLTableSectionElement, row: T, rowIndex: number, columns: Column<T>[], leading: number) {
    const tr = document.createElement("tr");
    const rowId = this.getRowId(row, rowIndex);
    if (this.options.checkboxSelection) {
      const td = document.createElement("td");
      td.className = "gnx-control";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.selectedIds.has(rowId);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.selectedIds.add(rowId) : this.selectedIds.delete(rowId);
        this.options.onRowSelectionChange?.(this.options.rows.filter((entry, index) => this.selectedIds.has(this.getRowId(entry, index))));
      });
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    if (this.options.rowNumbers) {
      const rowNumber = cell(String(rowIndex + 1));
      rowNumber.className = "gnx-control";
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
      tr.appendChild(rowNumber);
    }
    columns.forEach((column, columnIndex) => {
      const td = cell(formatValue(row, column, this.options.columns));
      if (this.activeCell?.rowIndex === rowIndex && this.activeCell.columnId === column.id) {
        td.classList.add("gnx-cell-active");
      }
      if (this.options.getTreeDataPath && columnIndex === 0) {
        const depth = Math.max(0, this.options.getTreeDataPath(row).length - 1);
        td.style.paddingLeft = `${12 + depth * 24}px`;
      }
      if (this.findText && formatValue(row, column, this.options.columns).toLowerCase().includes(this.findText.toLowerCase())) {
        td.classList.add("gnx-cell-active");
      }
      td.addEventListener("click", () => {
        this.activeCell = { rowIndex, columnId: column.id };
        this.options.onCellClick?.({ row, rowIndex, column });
        this.render();
      });
      if (column.editable) td.addEventListener("dblclick", () => this.editCell(td, row, rowIndex, column));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    if (this.options.masterDetailRenderer) {
      const detailRow = document.createElement("tr");
      const detail = document.createElement("td");
      detail.className = "gnx-detail";
      detail.colSpan = columns.length + leading;
      const content = this.options.masterDetailRenderer(row);
      content instanceof Node ? detail.appendChild(content) : detail.textContent = String(content ?? "");
      detailRow.appendChild(detail);
      tbody.appendChild(detailRow);
    }
  }

  private editCell(td: HTMLTableCellElement, row: T, rowIndex: number, column: Column<T>) {
    const oldValue = getValue(row, column);
    const input = document.createElement("input");
    input.value = String(oldValue ?? "");
    td.replaceChildren(input);
    input.focus();
    const commit = () => {
      this.setCellValue(row, rowIndex, column, input.value);
      this.render();
    };
    input.addEventListener("blur", commit, { once: true });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") input.blur();
      if (event.key === "Escape") this.render();
    });
  }

  private renderSidePanel() {
    const side = document.createElement("aside");
    side.className = "gnx-side";
    const tabs = document.createElement("div");
    tabs.className = "gnx-tabs";
    const tab = document.createElement("button");
    tab.className = `gnx-tab${this.sideOpen ? " active" : ""}`;
    tab.type = "button";
    tab.textContent = "Columns";
    tab.addEventListener("click", () => {
      this.sideOpen = !this.sideOpen;
      this.render();
    });
    tabs.appendChild(tab);
    side.appendChild(tabs);
    if (!this.sideOpen) return side;
    const panel = document.createElement("div");
    panel.className = "gnx-panel";
    panel.appendChild(this.renderColumnPanel());
    panel.appendChild(this.renderPivotPanel());
    panel.appendChild(this.renderAdvancedPanel());
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
