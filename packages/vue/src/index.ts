import { defineComponent, h, onMounted, ref, watch, type PropType } from "vue";
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

export interface GridNexaVueOptions<T = Record<string, unknown>>
  extends GridOptions<T> {
  pageSize?: number;
  groupBy?: keyof T & string;
}

type RowRecord = Record<string, unknown>;
type SortState = { columnId: string; direction: "asc" | "desc" } | null;
type CellPoint = { rowIndex: number; columnId: string };
type CellEdit = {
  row: RowRecord;
  rowIndex: number;
  column: Column<RowRecord>;
  oldValue: unknown;
  newValue: unknown;
};
type DisplayRow =
  | { kind: "group"; key: string; label: string; rows: RowRecord[]; summaries: string }
  | { kind: "data"; row: RowRecord; rowIndex: number; depth?: number; treeKey?: string; hasChildren?: boolean };

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
    : columns.filter((column) => rows.some((row) => typeof value(row, column, columns) === "number")).map((column) => String(column.field));
  const pivotLabels = Array.from(new Set(rows.map((row) => String(row[pivotBy] ?? "Blank"))));
  const groupLabels = Array.from(new Set(rows.map((row) => String(groupBy ? row[groupBy] : "Total"))));
  const pivotColumns: Column<RowRecord>[] = [
    { id: "__group", field: "__group", headerName: groupBy ?? "Group", width: 180 },
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
      const bucket = rows.filter((row) => String(row[pivotBy] ?? "Blank") === pivot && String(groupBy ? row[groupBy] : "Total") === group);
      valueFields.forEach((field) => {
        output[`${pivot}_${field}`] = aggregate(bucket.map((row) => row[field]), pivotAggregation);
      });
    });
    return output;
  });
  return { columns: pivotColumns as Column<T>[], rows: pivotRows as T[], active: true };
}

function buildGroupSummary<T extends RowRecord>(rows: T[], columns: Column<T>[], groupBy?: string) {
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

export const GridNexaVue = defineComponent({
  name: "GridNexaVue",
  props: {
    columns: { type: Array as PropType<Column<RowRecord>[]>, required: true },
    rows: { type: Array as PropType<RowRecord[]>, required: true },
    className: { type: String, default: undefined },
    theme: { type: String as PropType<GridNexaVueOptions<RowRecord>["theme"]>, default: "light" },
    density: { type: String as PropType<GridNexaVueOptions<RowRecord>["density"]>, default: "standard" },
    unstyled: { type: Boolean, default: false },
    classNames: { type: Object as PropType<GridNexaVueOptions<RowRecord>["classNames"]>, default: () => ({}) },
    getRowClassName: { type: Function as PropType<GridNexaVueOptions<RowRecord>["getRowClassName"]>, default: undefined },
    getCellClassName: { type: Function as PropType<GridNexaVueOptions<RowRecord>["getCellClassName"]>, default: undefined },
    getHeaderClassName: { type: Function as PropType<GridNexaVueOptions<RowRecord>["getHeaderClassName"]>, default: undefined },
    mergedHeaders: { type: Array as PropType<MergedHeader[]>, default: undefined },
    rowNumbers: { type: Boolean, default: false },
    checkboxSelection: { type: Boolean, default: false },
    enableRangeSelection: { type: Boolean, default: true },
    enableFillHandle: { type: Boolean, default: true },
    enableUndoRedo: { type: Boolean, default: true },
    quickFilterText: { type: String, default: "" },
    columnFilters: { type: Object as PropType<Record<string, ColumnFilterModel>>, default: undefined },
    externalFilter: { type: Function as PropType<GridNexaVueOptions<RowRecord>["externalFilter"]>, default: undefined },
    advancedFilter: { type: Function as PropType<GridNexaVueOptions<RowRecord>["advancedFilter"]>, default: undefined },
    advancedFilterModel: { type: Object as PropType<AdvancedFilterModel | null>, default: undefined },
    pageSize: { type: Number, default: undefined },
    groupBy: { type: String, default: undefined },
    pivotBy: { type: String, default: undefined },
    pivotValueColumns: { type: Array as PropType<string[]>, default: undefined },
    pivotAggregation: { type: String as PropType<PivotAggregation>, default: "sum" },
    getRowId: { type: Function as PropType<GridNexaVueOptions<RowRecord>["getRowId"]>, default: undefined },
    getTreeDataPath: { type: Function as PropType<GridNexaVueOptions<RowRecord>["getTreeDataPath"]>, default: undefined },
    masterDetailRenderer: { type: Function as PropType<GridNexaVueOptions<RowRecord>["masterDetailRenderer"]>, default: undefined },
    transaction: { type: Object as PropType<GridTransaction<RowRecord>>, default: undefined },
    localeText: { type: Object as PropType<Record<string, string>>, default: undefined },
    ai: { type: Object as PropType<GridNexaAiOptions>, default: undefined },
  },
  emits: [
    "rowSelectionChange",
    "cellClick",
    "advancedFilterModelChange",
    "pivotModelChange",
    "cellValueChange",
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
    let contextMenu: { x: number; y: number; rowIndex: number; columnId: string } | null = null;
    let localQuickFilterText = props.quickFilterText;
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
    const hiddenColumnIds = new Set(props.columns.filter((column) => column.hidden).map((column) => column.id));
    const expandedDetailIds = new Set<string | number>();
    const collapsedGroups = new Set<string>();
    const collapsedTreeKeys = new Set<string>();
    const columnWidths = new Map<string, number>();
    const undoStack: CellEdit[] = [];
    const redoStack: CellEdit[] = [];

    const rowId = (row: RowRecord, index: number) => props.getRowId?.(row, index) ?? index;
    const syncWorkingData = () => {
      workingRows = [...props.rows];
      workingColumns = [...props.columns];
      props.columns.filter((column) => column.hidden).forEach((column) => hiddenColumnIds.add(column.id));
      props.columns.forEach((column) => {
        if (column.width && !columnWidths.has(column.id)) columnWidths.set(column.id, column.width);
      });
    };
    const visibleRows = () => {
      const query = localQuickFilterText.trim().toLowerCase();
      const rows = workingRows.filter((row) => {
        if (props.externalFilter && !props.externalFilter(row)) return false;
        if (props.advancedFilter && !props.advancedFilter(row)) return false;
        if (!matchesAdvanced(row, workingColumns, props.advancedFilterModel)) return false;
        if (query && !workingColumns.some((column) => String(value(row, column, workingColumns) ?? "").toLowerCase().includes(query))) return false;
        return Object.entries(props.columnFilters ?? {}).every(([columnId, filter]) => {
          const column = workingColumns.find((entry) => entry.id === columnId);
          return column ? matches(row, column, filter, workingColumns) : true;
        });
      });
      if (!sortState) return rows;
      const column = workingColumns.find((entry) => entry.id === sortState?.columnId);
      if (!column) return rows;
      return [...rows].sort((left, right) => {
        const comparison = String(value(left, column, workingColumns) ?? "").localeCompare(String(value(right, column, workingColumns) ?? ""), undefined, { numeric: true });
        return sortState?.direction === "asc" ? comparison : -comparison;
      });
    };

    const setCellValue = (row: RowRecord, rowIndex: number, column: Column<RowRecord>, nextValue: unknown, trackHistory = true) => {
      const oldValue = rawValue(row, column);
      const newValue = typeof oldValue === "number" ? Number(nextValue) : nextValue;
      if (trackHistory && props.enableUndoRedo) {
        undoStack.push({ row, rowIndex, column, oldValue, newValue });
        redoStack.length = 0;
      }
      row[column.field] = newValue;
      emit("cellValueChange", { row, rowIndex, column, oldValue, newValue });
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
      if (!activeCell || !props.enableFillHandle) return;
      const column = workingColumns.find((entry) => entry.id === activeCell?.columnId);
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
      if (!sourceRow || !targetRow || !column || column.editable === false) return;
      setCellValue(targetRow, activeCell.rowIndex + 1, column, rawValue(sourceRow, column));
      render();
    };

    const copyActiveCell = async () => {
      if (!activeCell || typeof navigator === "undefined") return;
      if (rangeAnchor && rangeEnd) {
        const columns = workingColumns.filter((column) => !column.hidden && !hiddenColumnIds.has(column.id));
        const anchorColumn = columns.findIndex((entry) => entry.id === rangeAnchor?.columnId);
        const endColumn = columns.findIndex((entry) => entry.id === rangeEnd?.columnId);
        const text = workingRows
          .slice(Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex), Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex) + 1)
          .map((row) => columns.slice(Math.min(anchorColumn, endColumn), Math.max(anchorColumn, endColumn) + 1).map((column) => format(row, column, workingColumns)).join("\t"))
          .join("\n");
        await navigator.clipboard?.writeText(text);
        return;
      }
      const row = workingRows[activeCell.rowIndex];
      const column = workingColumns.find((entry) => entry.id === activeCell?.columnId);
      if (!row || !column) return;
      await navigator.clipboard?.writeText(format(row, column, workingColumns));
    };

    const pasteActiveCell = async () => {
      if (!activeCell || typeof navigator === "undefined") return;
      const text = await navigator.clipboard?.readText();
      const columns = workingColumns.filter((column) => !column.hidden && !hiddenColumnIds.has(column.id));
      const startColumn = columns.findIndex((entry) => entry.id === activeCell?.columnId);
      text.split(/\r?\n/).forEach((line, rowOffset) => {
        line.split("\t").forEach((value, columnOffset) => {
          const rowIndex = activeCell!.rowIndex + rowOffset;
          const row = workingRows[rowIndex];
          const column = columns[startColumn + columnOffset];
          if (row && column && column.editable !== false) setCellValue(row, rowIndex, column, value);
        });
      });
      render();
    };

    const moveRow = (rowIndex: number, direction: -1 | 1) => {
      const nextIndex = rowIndex + direction;
      if (nextIndex < 0 || nextIndex >= workingRows.length) return;
      const [row] = workingRows.splice(rowIndex, 1);
      workingRows.splice(nextIndex, 0, row);
      render();
    };

    const reorderRow = (sourceIndex: number, targetIndex: number) => {
      if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0 || sourceIndex >= workingRows.length || targetIndex >= workingRows.length) return;
      const [row] = workingRows.splice(sourceIndex, 1);
      workingRows.splice(targetIndex, 0, row);
      render();
    };

    const moveColumn = (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;
      const sourceIndex = workingColumns.findIndex((column) => column.id === sourceId);
      const targetIndex = workingColumns.findIndex((column) => column.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const [column] = workingColumns.splice(sourceIndex, 1);
      workingColumns.splice(targetIndex, 0, column);
      render();
    };

    const resolveColumn = (idOrField?: string | null) =>
      idOrField ? workingColumns.find((column) => column.id === idOrField || column.field === idOrField) : undefined;

    const createAiRequest = (prompt: string): GridNexaAiRequest => ({
      prompt,
      state: {
        columns: workingColumns.map((column) => ({
          id: column.id,
          field: String(column.field),
          headerName: column.headerName,
          type: typeof column.filter === "string" ? column.filter : column.filter?.type,
          hidden: hiddenColumnIds.has(column.id) || column.hidden,
          pinned: column.pinned,
        })),
        rowCount: workingRows.length,
        sampleRows: workingRows.slice(0, props.ai?.sampleRowCount ?? 8).map((row) =>
          Object.fromEntries(workingColumns.map((column) => [String(column.field), value(row, column, workingColumns)])),
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
        if (column) emit("advancedFilterModelChange", {
          kind: "group",
          joinOperator: "and",
          conditions: action.filter ? [{ kind: "rule", columnId: column.id, operator: action.filter.operator, value: action.filter.value, valueTo: action.filter.valueTo, values: action.filter.values }] : [],
        } satisfies AdvancedFilterModel);
      } else if (action.type === "setAdvancedFilter") {
        emit("advancedFilterModelChange", action.model);
      } else if (action.type === "sort") {
        const column = resolveColumn(action.columnId);
        sortState = column && action.direction ? { columnId: column.id, direction: action.direction } : null;
      } else if (action.type === "group") {
        const column = resolveColumn(action.columnId);
        emit("pivotModelChange", { groupBy: column?.field, pivotBy: props.pivotBy, pivotValueColumns: props.pivotValueColumns ?? [], pivotAggregation: props.pivotAggregation });
      } else if (action.type === "pivot") {
        const groupColumn = resolveColumn(action.groupBy);
        const pivotColumn = resolveColumn(action.pivotBy);
        const valueColumns = (action.valueColumns ?? []).map((columnId) => resolveColumn(columnId)?.field).filter(Boolean) as string[];
        emit("pivotModelChange", {
          groupBy: action.groupBy === null ? undefined : groupColumn?.field,
          pivotBy: action.pivotBy === null ? undefined : pivotColumn?.field,
          pivotValueColumns: valueColumns.length ? valueColumns : props.pivotValueColumns ?? [],
          pivotAggregation: action.aggregation ?? props.pivotAggregation,
        });
      } else if (action.type === "pinColumn") {
        const column = resolveColumn(action.columnId);
        if (column) column.pinned = action.pinned ?? undefined;
      } else if (action.type === "hideColumn") {
        const column = resolveColumn(action.columnId);
        if (column) action.hidden ? hiddenColumnIds.add(column.id) : hiddenColumnIds.delete(column.id);
      } else if (action.type === "export") {
        const visible = workingColumns.filter((column) => !hiddenColumnIds.has(column.id) && !column.hidden);
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
            ? await (await (props.ai.fetcher ?? fetch)(props.ai.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
              })).json()
            : null;
        const plan = result && "plan" in result ? result.plan : result as GridNexaCommandPlan;
        if (!plan?.actions?.length) throw new Error("AI did not return any grid actions.");
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
          { kind: "group" as const, key, label: key, rows: bucket, summaries: buildGroupSummary(bucket, workingColumns, groupBy) },
          ...(collapsedGroups.has(key) ? [] : bucket.map((row) => ({ kind: "data" as const, row, rowIndex: workingRows.indexOf(row) }))),
        ]);
      }
      if (props.getTreeDataPath) {
        return rows
          .map((row) => {
            const path = props.getTreeDataPath?.(row).filter(Boolean) ?? [];
            return { row, path, key: path.join("/") };
          })
          .sort((left, right) => left.key.localeCompare(right.key))
          .filter((entry) => entry.path.slice(0, -1).every((_, index) => !collapsedTreeKeys.has(entry.path.slice(0, index + 1).join("/"))))
          .map((entry, _index, entries) => ({
            kind: "data" as const,
            row: entry.row,
            rowIndex: workingRows.indexOf(entry.row),
            depth: Math.max(0, entry.path.length - 1),
            treeKey: entry.key,
            hasChildren: entries.some((other) => other.key.startsWith(`${entry.key}/`)),
          }));
      }
      return rows.map((row) => ({ kind: "data", row, rowIndex: workingRows.indexOf(row) }));
    };

    const isCellInRange = (rowIndex: number, columnId: string, columns: Column<RowRecord>[]) => {
      if (!rangeAnchor || !rangeEnd || !props.enableRangeSelection) return false;
      const columnIndex = columns.findIndex((column) => column.id === columnId);
      const anchorIndex = columns.findIndex((column) => column.id === rangeAnchor?.columnId);
      const endIndex = columns.findIndex((column) => column.id === rangeEnd?.columnId);
      return rowIndex >= Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex) &&
        rowIndex <= Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex) &&
        columnIndex >= Math.min(anchorIndex, endIndex) &&
        columnIndex <= Math.max(anchorIndex, endIndex);
    };

    const startColumnResize = (event: MouseEvent, column: Column<RowRecord>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = columnWidths.get(column.id) ?? column.width ?? 150;
      const move = (moveEvent: MouseEvent) => {
        columnWidths.set(column.id, Math.max(72, startWidth + moveEvent.clientX - startX));
        render();
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };

    const pinnedStyle = (column: Column<RowRecord>, columns: Column<RowRecord>[]) => {
      if (!column.pinned) return "";
      const index = columns.findIndex((entry) => entry.id === column.id);
      const width = (entry: Column<RowRecord>) => columnWidths.get(entry.id) ?? entry.width ?? 150;
      const offset =
        column.pinned === "left"
          ? columns.slice(0, index).filter((entry) => entry.pinned === "left").reduce((sum, entry) => sum + width(entry), 0)
          : columns.slice(index + 1).filter((entry) => entry.pinned === "right").reduce((sum, entry) => sum + width(entry), 0);
      return `position:sticky;${column.pinned}:${offset}px;z-index:2;background:white;box-shadow:${column.pinned === "left" ? "inset -1px 0 #dbe3ef" : "inset 1px 0 #dbe3ef"};`;
    };

    const download = (columns: Column<RowRecord>[], rows: RowRecord[], excel = false) => {
      const content = excel
        ? `<table><tr>${columns.map((column) => `<th>${column.headerName}</th>`).join("")}</tr>${rows.map((row) => `<tr>${columns.map((column) => `<td>${format(row, column, workingColumns)}</td>`).join("")}</tr>`).join("")}</table>`
        : [columns.map((column) => JSON.stringify(column.headerName)).join(","), ...rows.map((row) => columns.map((column) => JSON.stringify(format(row, column, workingColumns))).join(","))].join("\n");
      const blob = new Blob([content], { type: excel ? "application/vnd.ms-excel" : "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = excel ? "gridnexa-export.xls" : "gridnexa-export.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const render = () => {
      if (!host.value) return;
      const sourceRows = visibleRows();
      const pivot = buildPivot(sourceRows, workingColumns, props.groupBy, props.pivotBy, props.pivotValueColumns, props.pivotAggregation);
      const columns = pivot.columns
        .filter((column) => !column.hidden && !hiddenColumnIds.has(column.id))
        .sort((left, right) => (left.pinned === "left" ? 0 : left.pinned === "right" ? 2 : 1) - (right.pinned === "left" ? 0 : right.pinned === "right" ? 2 : 1));
      const pageRows = props.pageSize ? pivot.rows.slice(pageIndex.value * props.pageSize, pageIndex.value * props.pageSize + props.pageSize) : pivot.rows;
      const displayRows = pivot.active ? pageRows.map((row) => ({ kind: "data" as const, row, rowIndex: pivot.rows.indexOf(row) })) : makeDisplayRows(pageRows);
      const root = document.createElement("div");
      root.className = ["gridnexa-vue-grid", props.className].filter(Boolean).join(" ");
      root.dataset.gnxTheme = props.theme ?? "light";
      root.dataset.gnxDensity = props.density ?? "standard";
      root.append(renderToolbar(columns, pivot.rows), renderTable(columns, displayRows));
      if (toolsOpen) root.appendChild(renderToolsPanel());
      root.appendChild(renderStatus(pivot.rows.length));
      if (contextMenu) root.appendChild(renderContextMenu());
      host.value.replaceChildren(root);
      emit("serverSideOperation", {
        sortModel: sortState ? [sortState] : [],
        filterModel: props.columnFilters,
        advancedFilterModel: props.advancedFilterModel,
        selectedRowIds: Array.from(selected),
        pageIndex: pageIndex.value,
        pageSize: props.pageSize,
        groupBy: props.groupBy,
        pivotBy: props.pivotBy,
        pivotValueColumns: props.pivotValueColumns,
        pivotAggregation: props.pivotAggregation,
        treeData: Boolean(props.getTreeDataPath),
        masterDetail: Boolean(props.masterDetailRenderer),
      } satisfies ServerSideOperationState<RowRecord>);
    };

    const renderToolbar = (columns: Column<RowRecord>[], rows: RowRecord[]) => {
      const toolbar = document.createElement("div");
      toolbar.style.cssText = "display:flex;gap:8px;justify-content:space-between;align-items:center;padding:10px;background:#f8fbff;border:1px solid #dbe3ef";
      toolbar.append(`${rows.length} rows`);
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
      const aiEnabled = props.ai?.enabled ?? Boolean(props.ai?.provider || props.ai?.endpoint);
      if (aiEnabled) toolbar.appendChild(renderAiCommand());
      const find = document.createElement("input");
      find.type = "search";
      find.placeholder = "Find cell";
      find.value = findText;
      find.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
      find.addEventListener("input", () => {
        findText = find.value;
        render();
      });
      const quickFilter = document.createElement("input");
      quickFilter.type = "search";
      quickFilter.placeholder = "Quick filter";
      quickFilter.value = localQuickFilterText;
      quickFilter.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
      quickFilter.addEventListener("input", () => {
        localQuickFilterText = quickFilter.value;
        pageIndex.value = 0;
        render();
      });
      const pageCount = props.pageSize ? Math.max(1, Math.ceil(rows.length / props.pageSize)) : 1;
      if (props.pageSize) {
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
      actions.append(quickFilter, find);
      if (props.enableUndoRedo) {
        const undoButton = button("Undo", undo);
        undoButton.disabled = !undoStack.length;
        const redoButton = button("Redo", redo);
        redoButton.disabled = !redoStack.length;
        actions.append(undoButton, redoButton);
      }
      if (props.enableFillHandle) actions.appendChild(button("Fill", fillDown));
      actions.append(
        button("Copy", () => void copyActiveCell()),
        button("Paste", () => void pasteActiveCell()),
        button(toolsOpen ? "Hide tools" : "Tools", () => {
          toolsOpen = !toolsOpen;
          render();
        }),
        button("Export CSV", () => download(columns, rows)),
        button("Export Excel", () => download(columns, rows, true)),
      );
      toolbar.appendChild(actions);
      return toolbar;
    };

    const renderAiCommand = () => {
      const shell = document.createElement("div");
      shell.style.cssText = "display:flex;gap:8px;align-items:end;flex-wrap:wrap";
      const input = document.createElement("input");
      input.placeholder = props.ai?.placeholder ?? "Ask AI to filter, sort, group, pivot, pin, or export";
      input.value = aiPrompt;
      input.style.cssText = "min-height:32px;min-width:280px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
      input.addEventListener("input", () => {
        aiPrompt = input.value;
      });
      const ask = button(aiBusy ? "Thinking" : "Ask AI", () => void requestAiPlan());
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
      const table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse";
      const thead = document.createElement("thead");
      const leading = Number(props.checkboxSelection) + Number(props.rowNumbers);
      if (props.mergedHeaders?.length) thead.appendChild(renderMergedHeaders(columns, leading));
      const header = document.createElement("tr");
      if (props.checkboxSelection) header.appendChild(cell("", "th"));
      if (props.rowNumbers) header.appendChild(cell("#", "th"));
      columns.forEach((column, columnIndex) => {
        const th = cell(`${column.headerName}${sortState?.columnId === column.id ? (sortState.direction === "asc" ? " ↑" : " ↓") : ""}`, "th");
        th.style.cssText = `padding:10px;border:1px solid #dbe3ef;background:#f8fbff;text-align:left;width:${columnWidths.get(column.id) ?? column.width ?? 150}px;${pinnedStyle(column, columns)}`;
        th.className = classNameList(
          props.classNames?.headerCell,
          typeof column.headerClassName === "function"
            ? column.headerClassName({ column })
            : column.headerClassName,
          props.getHeaderClassName?.({ column, columnIndex }),
        );
        th.draggable = true;
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
          if (column.sortable === false) return;
          sortState = sortState?.columnId !== column.id ? { columnId: column.id, direction: "asc" } : sortState.direction === "asc" ? { columnId: column.id, direction: "desc" } : null;
          render();
        });
        if (column.resizable !== false) {
          const resizer = document.createElement("span");
          resizer.style.cssText = "float:right;width:7px;height:24px;cursor:col-resize;border-right:2px solid #bfdbfe";
          resizer.addEventListener("mousedown", (event) => startColumnResize(event, column));
          th.appendChild(resizer);
        }
        header.appendChild(th);
      });
      thead.appendChild(header);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      rows.forEach((entry) => {
        if (entry.kind === "group") appendGroupRow(tbody, entry, columns.length + leading);
        if (entry.kind === "data") {
          appendRow(tbody, entry.row, entry.rowIndex, columns, leading, entry);
          const id = rowId(entry.row, entry.rowIndex);
          if (props.masterDetailRenderer && expandedDetailIds.has(id)) appendDetailRow(tbody, entry.row, columns.length + leading);
        }
      });
      table.appendChild(tbody);
      return table;
    };

    const renderMergedHeaders = (columns: Column<RowRecord>[], leading: number) => {
      const row = document.createElement("tr");
      if (leading) {
        const spacer = cell("", "th");
        spacer.colSpan = leading;
        row.appendChild(spacer);
      }
      (props.mergedHeaders ?? []).forEach((header) => {
        const count = header.columnIds.filter((columnId) => columns.some((column) => column.id === columnId)).length;
        if (!count) return;
        const th = cell(header.headerName, "th");
        th.colSpan = count;
        th.style.cssText = "padding:8px;border:1px solid #bfdbfe;background:#e8f1ff;text-align:center";
        row.appendChild(th);
      });
      return row;
    };

    const appendGroupRow = (tbody: HTMLTableSectionElement, entry: Extract<DisplayRow, { kind: "group" }>, colSpan: number) => {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = colSpan;
      td.style.cssText = "padding:10px;border:1px solid #dbe3ef;background:#eef4ff;color:#153e90;font-weight:800;text-transform:uppercase";
      const toggle = button(collapsedGroups.has(entry.key) ? "+" : "-", () => {
        collapsedGroups.has(entry.key) ? collapsedGroups.delete(entry.key) : collapsedGroups.add(entry.key);
        render();
      });
      td.append(toggle, `${entry.label}  ${entry.rows.length} rows${entry.summaries ? `  ${entry.summaries}` : ""}`);
      tr.appendChild(td);
      tbody.appendChild(tr);
    };

    const appendDetailRow = (tbody: HTMLTableSectionElement, row: RowRecord, colSpan: number) => {
      const detailRow = document.createElement("tr");
      const detail = document.createElement("td");
      detail.colSpan = colSpan;
      detail.style.cssText = "padding:12px;border:1px solid #dbe3ef;background:#f8fbff;color:#334155";
      const content = props.masterDetailRenderer?.(row);
      content instanceof Node ? detail.appendChild(content) : detail.textContent = String(content ?? "");
      detailRow.appendChild(detail);
      tbody.appendChild(detailRow);
    };

    const appendRow = (tbody: HTMLTableSectionElement, row: RowRecord, rowIndex: number, columns: Column<RowRecord>[], leading: number, display?: Extract<DisplayRow, { kind: "data" }>) => {
      const tr = document.createElement("tr");
      const rowSelected = selected.has(rowId(row, rowIndex));
      tr.className = classNameList(
        props.classNames?.row,
        props.getRowClassName?.({ row, rowIndex, selected: rowSelected }),
      );
      tr.draggable = true;
      tr.addEventListener("dragstart", () => {
        draggedRowIndex = rowIndex;
      });
      tr.addEventListener("dragover", (event) => event.preventDefault());
      tr.addEventListener("drop", (event) => {
        event.preventDefault();
        if (draggedRowIndex != null) reorderRow(draggedRowIndex, rowIndex);
        draggedRowIndex = null;
      });
      if (props.checkboxSelection) {
        const td = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selected.has(rowId(row, rowIndex));
        checkbox.addEventListener("change", () => {
          checkbox.checked ? selected.add(rowId(row, rowIndex)) : selected.delete(rowId(row, rowIndex));
          emit("rowSelectionChange", props.rows.filter((entry, index) => selected.has(rowId(entry, index))));
          render();
        });
        td.appendChild(checkbox);
        tr.appendChild(td);
      }
      if (props.rowNumbers) {
        const rowNumber = cell(String(rowIndex + 1));
        const up = button("↑", () => moveRow(rowIndex, -1));
        up.disabled = rowIndex <= 0;
        const down = button("↓", () => moveRow(rowIndex, 1));
        down.disabled = rowIndex >= workingRows.length - 1;
        rowNumber.append(" ", up, down);
        tr.appendChild(rowNumber);
      }
      columns.forEach((column, columnIndex) => {
        const cellValue = value(row, column, workingColumns);
        const td = cell(format(row, column, workingColumns));
        td.className = classNameList(
          props.classNames?.cell,
          resolveClassName(column.className, { value: cellValue, row, rowIndex, column }),
          resolveClassName(column.cellClassName, { value: cellValue, row, rowIndex, column }),
          props.getCellClassName?.({
            value: cellValue,
            row,
            rowIndex,
            column,
            columnIndex,
            selected: rowSelected,
          }),
        );
        td.style.cssText = `padding:10px;border:1px solid #dbe3ef;width:${columnWidths.get(column.id) ?? column.width ?? 150}px;${pinnedStyle(column, columns)}`;
        if (activeCell?.rowIndex === rowIndex && activeCell.columnId === column.id) {
          td.style.outline = "2px solid #2563eb";
          td.style.outlineOffset = "-2px";
        }
        if (isCellInRange(rowIndex, column.id, columns)) td.style.background = "rgba(37,99,235,.12)";
        if (findText && format(row, column, workingColumns).toLowerCase().includes(findText.toLowerCase())) {
          td.style.background = "rgba(37,99,235,.1)";
        }
        if (props.getTreeDataPath && columnIndex === 0) {
          td.style.paddingLeft = `${12 + (display?.depth ?? Math.max(0, props.getTreeDataPath(row).length - 1)) * 24}px`;
          if (display?.hasChildren && display.treeKey) {
            const treeKey = display.treeKey;
            const toggle = button(collapsedTreeKeys.has(treeKey) ? "+" : "-", () => {
              collapsedTreeKeys.has(treeKey) ? collapsedTreeKeys.delete(treeKey) : collapsedTreeKeys.add(treeKey);
              render();
            });
            td.prepend(toggle);
          }
        } else if (props.masterDetailRenderer && columnIndex === 0) {
          const id = rowId(row, rowIndex);
          const toggle = button(expandedDetailIds.has(id) ? "-" : "+", () => {
            expandedDetailIds.has(id) ? expandedDetailIds.delete(id) : expandedDetailIds.add(id);
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
          emit("cellClick", { row, rowIndex, column });
          render();
        });
        td.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          activeCell = { rowIndex, columnId: column.id };
          contextMenu = { x: event.clientX, y: event.clientY, rowIndex, columnId: column.id };
          render();
        });
        if (column.editable) td.addEventListener("dblclick", () => editCell(td, row, rowIndex, column));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    };

    const editCell = (td: HTMLTableCellElement, row: RowRecord, rowIndex: number, column: Column<RowRecord>) => {
      const oldValue = rawValue(row, column);
      const input = createEditor(column, oldValue);
      td.replaceChildren(input);
      input.focus();
      input.addEventListener("blur", () => {
        const newValue = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
        setCellValue(row, rowIndex, column, newValue);
        render();
      }, { once: true });
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
    };

    const renderContextMenu = () => {
      const menu = document.createElement("div");
      menu.style.cssText = `position:fixed;z-index:9999;left:${contextMenu?.x ?? 0}px;top:${contextMenu?.y ?? 0}px;display:grid;min-width:150px;padding:6px;border:1px solid #dbe3ef;border-radius:10px;background:white;box-shadow:0 18px 48px rgba(15,23,42,.18)`;
      const row = contextMenu ? workingRows[contextMenu.rowIndex] : undefined;
      const column = workingColumns.find((entry) => entry.id === contextMenu?.columnId);
      menu.append(
        button("Copy", () => void copyActiveCell()),
        button("Paste", () => void pasteActiveCell()),
        button("Edit cell", () => {
          if (!row || !column || column.editable === false || !contextMenu) return;
          const nextValue = window.prompt(`Edit ${column.headerName}`, String(rawValue(row, column) ?? ""));
          if (nextValue != null) setCellValue(row, contextMenu.rowIndex, column, nextValue);
          contextMenu = null;
          render();
        }),
        button("Clear cell", () => {
          if (row && column && column.editable !== false && contextMenu) setCellValue(row, contextMenu.rowIndex, column, "");
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

    const renderToolsPanel = () => {
      const panel = document.createElement("div");
      panel.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:12px;border:1px solid #dbe3ef;border-top:0;background:#f8fbff";
      const columnsSection = document.createElement("section");
      columnsSection.appendChild(document.createElement("strong")).textContent = "Columns";
      workingColumns.forEach((column) => {
        const label = document.createElement("label");
        label.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:6px";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !hiddenColumnIds.has(column.id);
        checkbox.addEventListener("change", () => {
          checkbox.checked ? hiddenColumnIds.delete(column.id) : hiddenColumnIds.add(column.id);
          render();
        });
        label.append(checkbox, column.headerName);
        columnsSection.appendChild(label);
      });

      const pivotSection = document.createElement("section");
      pivotSection.appendChild(document.createElement("strong")).textContent = "Pivot";
      pivotSection.append(
        select("Row group", props.groupBy, "No group", (value) => emit("pivotModelChange", { groupBy: value, pivotBy: props.pivotBy, pivotValueColumns: props.pivotValueColumns ?? [], pivotAggregation: props.pivotAggregation })),
        select("Pivot by", props.pivotBy, "Pivot off", (value) => emit("pivotModelChange", { groupBy: props.groupBy, pivotBy: value, pivotValueColumns: props.pivotValueColumns ?? [], pivotAggregation: props.pivotAggregation })),
        select("Value", props.pivotValueColumns?.[0], "No value", (value) => emit("pivotModelChange", { groupBy: props.groupBy, pivotBy: props.pivotBy, pivotValueColumns: value ? [value] : [], pivotAggregation: props.pivotAggregation })),
        select("Aggregation", props.pivotAggregation, "", (value) => emit("pivotModelChange", { groupBy: props.groupBy, pivotBy: props.pivotBy, pivotValueColumns: props.pivotValueColumns ?? [], pivotAggregation: value as PivotAggregation }), ["sum", "avg", "count", "min", "max"]),
      );

      const filterSection = document.createElement("section");
      filterSection.appendChild(document.createElement("strong")).textContent = "Advanced filter";
      const columnSelect = select("", workingColumns[0]?.id, "", () => undefined, workingColumns.map((column) => column.id));
      const operatorSelect = select("", "contains", "", () => undefined, ["contains", "equals", "gt", "gte", "lt", "lte", "blank", "notBlank"]);
      const valueInput = document.createElement("input");
      valueInput.placeholder = "Value";
      valueInput.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
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
                columnId: (columnSelect.querySelector("select") as HTMLSelectElement).value,
                operator: (operatorSelect.querySelector("select") as HTMLSelectElement).value as ColumnFilterModel["operator"],
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

    const select = (labelText: string, value: string | undefined, emptyLabel: string, onChange: (value: string | undefined) => void, fixedOptions?: string[]) => {
      const label = document.createElement("label");
      label.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:6px";
      if (labelText) label.append(`${labelText} `);
      const element = document.createElement("select");
      element.style.cssText = "min-height:32px;padding:0 8px;border:1px solid #bfdbfe;border-radius:8px";
      if (emptyLabel) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = emptyLabel;
        element.appendChild(option);
      }
      (fixedOptions ?? workingColumns.map((column) => String(column.field))).forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry;
        option.textContent = workingColumns.find((column) => column.id === entry || column.field === entry)?.headerName ?? entry;
        element.appendChild(option);
      });
      element.value = value ?? "";
      element.addEventListener("change", () => onChange(element.value || undefined));
      label.appendChild(element);
      return label;
    };

    const renderStatus = (totalRows: number) => {
      const status = document.createElement("div");
      status.style.cssText = "display:flex;gap:16px;padding:10px;border:1px solid #dbe3ef;border-top:0;font-weight:700";
      status.append(`${totalRows} rows`, `${selected.size} selected`, sortState ? `Sorted ${sortState.direction}` : "Unsorted");
      return status;
    };

    const button = (text: string, onClick: () => void) => {
      const element = document.createElement("button");
      element.type = "button";
      element.textContent = text;
      element.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px;background:#fff;color:#1d4ed8;font-weight:800";
      element.addEventListener("click", onClick);
      return element;
    };

    onMounted(render);
    watch(
      () => ({ ...props }),
      () => {
        syncWorkingData();
        localQuickFilterText = props.quickFilterText;
        render();
      },
      { deep: true },
    );

    return () => h("div", { ref: host, class: "gridnexa-vue-host" });
  },
});

export default GridNexaVue;
