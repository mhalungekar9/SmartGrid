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
  @Input() unstyled = false;
  @Input() classNames: GridNexaAngularOptions<T>["classNames"] = {};
  @Input() getRowClassName: GridNexaAngularOptions<T>["getRowClassName"];
  @Input() getCellClassName: GridNexaAngularOptions<T>["getCellClassName"];
  @Input() getHeaderClassName: GridNexaAngularOptions<T>["getHeaderClassName"];
  @Input() mergedHeaders: MergedHeader[] | undefined;
  @Input() rowNumbers = false;
  @Input() checkboxSelection = false;
  @Input() enableRangeSelection = true;
  @Input() enableFillHandle = true;
  @Input() enableUndoRedo = true;
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
  @Output() cellClick = new EventEmitter<{ row: T; rowIndex: number; column: Column<T> }>();
  @Output() cellValueChange = new EventEmitter<{
    row: T;
    rowIndex: number;
    column: Column<T>;
    oldValue: unknown;
    newValue: unknown;
  }>();
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

  ngAfterViewInit() {
    this.render();
  }

  ngOnChanges() {
    this.hiddenColumnIds = new Set(this.columns.filter((column) => column.hidden).map((column) => column.id));
    this.columns.forEach((column) => {
      if (column.width && !this.columnWidths.has(column.id)) this.columnWidths.set(column.id, column.width);
    });
    this.applyTransaction();
    this.render();
  }

  private rowId(row: T, index: number) {
    return this.getRowId?.(row, index) ?? index;
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

    if (trackHistory && this.enableUndoRedo) {
      this.undoStack.push({ row, rowIndex, column, oldValue, newValue });
      this.redoStack = [];
    }

    (row as Record<string, unknown>)[column.field] = newValue;
    this.cellValueChange.emit({ row, rowIndex, column, oldValue, newValue });
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
    if (!this.activeCell || !this.enableFillHandle) return;
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
    this.render();
  }

  private reorderRow(sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || sourceIndex >= this.rows.length || targetIndex >= this.rows.length) return;
    const rows = [...this.rows];
    const [row] = rows.splice(sourceIndex, 1);
    rows.splice(targetIndex, 0, row);
    this.rows = rows;
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
    if (!this.rangeAnchor || !this.rangeEnd || !this.enableRangeSelection) return false;
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
    const startWidth = this.columnWidths.get(column.id) ?? column.width ?? 150;
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

  private pinnedStyle(column: Column<T>, columns: Column<T>[]) {
    if (!column.pinned) return "";
    const index = columns.findIndex((entry) => entry.id === column.id);
    const width = (entry: Column<T>) => this.columnWidths.get(entry.id) ?? entry.width ?? 150;
    const offset =
      column.pinned === "left"
        ? columns.slice(0, index).filter((entry) => entry.pinned === "left").reduce((sum, entry) => sum + width(entry), 0)
        : columns.slice(index + 1).filter((entry) => entry.pinned === "right").reduce((sum, entry) => sum + width(entry), 0);
    return `position:sticky;${column.pinned}:${offset}px;z-index:2;background:white;box-shadow:${column.pinned === "left" ? "inset -1px 0 #dbe3ef" : "inset 1px 0 #dbe3ef"};`;
  }

  private updateAdvancedFilter(columnId: string, operator: ColumnFilterModel["operator"], filterValue: string) {
    const model: AdvancedFilterModel = {
      kind: "group",
      joinOperator: "and",
      conditions: [{ kind: "rule", columnId, operator, value: filterValue }],
    };
    this.advancedFilterModel = model;
    this.advancedFilterModelChange.emit(model);
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
    const pageRows = this.pageSize ? pivot.rows.slice(this.pageIndex * this.pageSize, this.pageIndex * this.pageSize + this.pageSize) : pivot.rows;
    const displayRows = pivot.active ? pageRows.map((row) => ({ kind: "data" as const, row, rowIndex: pivot.rows.indexOf(row) })) : this.makeDisplayRows(pageRows);
    const root = document.createElement("div");
    root.className = ["gridnexa-angular-grid", this.className]
      .filter(Boolean)
      .join(" ");
    root.dataset.gnxTheme = this.theme ?? "dark";
    root.dataset.gnxDensity = this.density ?? "standard";
    root.append(this.renderToolbar(columns, pivot.rows), this.renderTable(columns, displayRows));
    if (this.toolsOpen) root.appendChild(this.renderToolsPanel());
    root.appendChild(this.renderStatus(pivot.rows.length));
    if (this.contextMenu) root.appendChild(this.renderContextMenu());
    this.host.nativeElement.replaceChildren(root);
    this.serverSideOperation.emit({
      sortModel: this.sortState ? [this.sortState] : [],
      filterModel: this.columnFilters,
      advancedFilterModel: this.advancedFilterModel,
      selectedRowIds: Array.from(this.selected),
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      groupBy: this.groupBy,
      pivotBy: this.pivotBy,
      pivotValueColumns: this.pivotValueColumns,
      pivotAggregation: this.pivotAggregation,
      treeData: Boolean(this.getTreeDataPath),
      masterDetail: Boolean(this.masterDetailRenderer),
    });
  }

  private renderToolbar(columns: Column<T>[], rows: T[]) {
    const toolbar = document.createElement("div");
    toolbar.style.cssText = "display:flex;gap:8px;justify-content:space-between;align-items:center;padding:10px;background:#f8fbff;border:1px solid #dbe3ef";
    toolbar.append(`${rows.length} rows`);
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
    const aiEnabled = this.ai?.enabled ?? Boolean(this.ai?.provider || this.ai?.endpoint);
    if (aiEnabled) toolbar.appendChild(this.renderAiCommand());
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
    const pageCount = this.pageSize ? Math.max(1, Math.ceil(rows.length / this.pageSize)) : 1;
    if (this.pageSize) {
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
    actions.append(quickFilter, find);
    if (this.enableUndoRedo) {
      const undo = this.button("Undo", () => this.undo());
      undo.disabled = !this.undoStack.length;
      const redo = this.button("Redo", () => this.redo());
      redo.disabled = !this.redoStack.length;
      actions.append(undo, redo);
    }
    if (this.enableFillHandle) actions.appendChild(this.button("Fill", () => this.fillDown()));
    actions.append(
      this.button("Copy", () => void this.copyActiveCell()),
      this.button("Paste", () => void this.pasteActiveCell()),
      this.button(this.toolsOpen ? "Hide tools" : "Tools", () => {
        this.toolsOpen = !this.toolsOpen;
        this.render();
      }),
      this.button("Export CSV", () => this.exportRows(columns, rows)),
      this.button("Export Excel", () => this.exportRows(columns, rows, true)),
    );
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
    const table = document.createElement("table");
    table.style.cssText = "width:100%;border-collapse:collapse";
    const thead = document.createElement("thead");
    const leading = Number(this.checkboxSelection) + Number(this.rowNumbers);
    if (this.mergedHeaders?.length) thead.appendChild(this.renderMergedHeaders(columns, leading));
    const header = document.createElement("tr");
    if (this.checkboxSelection) header.appendChild(cell("", "th"));
    if (this.rowNumbers) header.appendChild(cell("#", "th"));
    columns.forEach((column, columnIndex) => {
      const th = cell(`${column.headerName}${this.sortState?.columnId === column.id ? (this.sortState.direction === "asc" ? " ↑" : " ↓") : ""}`, "th");
      th.style.cssText = `padding:10px;border:1px solid #dbe3ef;background:#f8fbff;text-align:left;width:${this.columnWidths.get(column.id) ?? column.width ?? 150}px;${this.pinnedStyle(column, columns)}`;
      th.className = classNameList(
        this.classNames?.headerCell,
        typeof column.headerClassName === "function"
          ? column.headerClassName({ column })
          : column.headerClassName,
        this.getHeaderClassName?.({ column, columnIndex }),
      );
      th.draggable = true;
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
        if (column.sortable === false) return;
        this.sortState = this.sortState?.columnId !== column.id ? { columnId: column.id, direction: "asc" } : this.sortState.direction === "asc" ? { columnId: column.id, direction: "desc" } : null;
        this.render();
      });
      if (column.resizable !== false) {
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
    tr.draggable = true;
    tr.addEventListener("dragstart", () => {
      this.draggedRowIndex = rowIndex;
    });
    tr.addEventListener("dragover", (event) => event.preventDefault());
    tr.addEventListener("drop", (event) => {
      event.preventDefault();
      if (this.draggedRowIndex != null) this.reorderRow(this.draggedRowIndex, rowIndex);
      this.draggedRowIndex = null;
    });
    if (this.checkboxSelection) {
      const td = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.selected.has(this.rowId(row, rowIndex));
      checkbox.addEventListener("change", () => {
        checkbox.checked ? this.selected.add(this.rowId(row, rowIndex)) : this.selected.delete(this.rowId(row, rowIndex));
        this.rowSelectionChange.emit(this.rows.filter((entry, index) => this.selected.has(this.rowId(entry, index))));
        this.render();
      });
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    if (this.rowNumbers) {
      const rowNumber = cell(String(rowIndex + 1));
      const up = this.button("↑", () => this.moveRow(rowIndex, -1));
      up.disabled = rowIndex <= 0;
      const down = this.button("↓", () => this.moveRow(rowIndex, 1));
      down.disabled = rowIndex >= this.rows.length - 1;
      rowNumber.append(" ", up, down);
      tr.appendChild(rowNumber);
    }
    columns.forEach((column, columnIndex) => {
      const cellValue = value(row, column, this.columns);
      const td = cell(format(row, column, this.columns));
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
      td.style.cssText = `padding:10px;border:1px solid #dbe3ef;width:${this.columnWidths.get(column.id) ?? column.width ?? 150}px;${this.pinnedStyle(column, columns)}`;
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
        this.cellClick.emit({ row, rowIndex, column });
        this.render();
      });
      td.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        this.activeCell = { rowIndex, columnId: column.id };
        this.contextMenu = { x: event.clientX, y: event.clientY, rowIndex, columnId: column.id };
        this.render();
      });
      if (column.editable) td.addEventListener("dblclick", () => this.editCell(td, row, rowIndex, column));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  private editCell(td: HTMLTableCellElement, row: T, rowIndex: number, column: Column<T>) {
    const oldValue = rawValue(row, column);
    const input = this.createEditor(column, oldValue);
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
    panel.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:12px;border:1px solid #dbe3ef;border-top:0;background:#f8fbff";
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
    const status = document.createElement("div");
    status.style.cssText = "display:flex;gap:16px;padding:10px;border:1px solid #dbe3ef;border-top:0;font-weight:700";
    status.append(`${totalRows} rows`, `${this.selected.size} selected`, this.sortState ? `Sorted ${this.sortState.direction}` : "Unsorted");
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
