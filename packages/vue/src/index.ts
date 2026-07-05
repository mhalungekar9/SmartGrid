import { defineComponent, h, onMounted, ref, watch, type PropType } from "vue";
import type {
  AdvancedFilterModel,
  Column,
  ColumnFilterModel,
  GridOptions,
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

function cell(text: string, tag: "td" | "th" = "td") {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

export const GridNexaVue = defineComponent({
  name: "GridNexaVue",
  props: {
    columns: { type: Array as PropType<Column<RowRecord>[]>, required: true },
    rows: { type: Array as PropType<RowRecord[]>, required: true },
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
    let findText = "";
    let toolsOpen = false;
    let draggedColumnId: string | null = null;
    let workingColumns = [...props.columns];
    let workingRows = [...props.rows];
    const hiddenColumnIds = new Set(props.columns.filter((column) => column.hidden).map((column) => column.id));
    const undoStack: CellEdit[] = [];
    const redoStack: CellEdit[] = [];

    const rowId = (row: RowRecord, index: number) => props.getRowId?.(row, index) ?? index;
    const syncWorkingData = () => {
      workingRows = [...props.rows];
      workingColumns = [...props.columns];
      props.columns.filter((column) => column.hidden).forEach((column) => hiddenColumnIds.add(column.id));
    };
    const visibleRows = () => {
      const query = props.quickFilterText.trim().toLowerCase();
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
      const sourceRow = workingRows[activeCell.rowIndex];
      const targetRow = workingRows[activeCell.rowIndex + 1];
      const column = workingColumns.find((entry) => entry.id === activeCell?.columnId);
      if (!sourceRow || !targetRow || !column || column.editable === false) return;
      setCellValue(targetRow, activeCell.rowIndex + 1, column, rawValue(sourceRow, column));
      render();
    };

    const copyActiveCell = async () => {
      if (!activeCell || typeof navigator === "undefined") return;
      const row = workingRows[activeCell.rowIndex];
      const column = workingColumns.find((entry) => entry.id === activeCell?.columnId);
      if (!row || !column) return;
      await navigator.clipboard?.writeText(format(row, column, workingColumns));
    };

    const pasteActiveCell = async () => {
      if (!activeCell || typeof navigator === "undefined") return;
      const row = workingRows[activeCell.rowIndex];
      const column = workingColumns.find((entry) => entry.id === activeCell?.columnId);
      if (!row || !column || column.editable === false) return;
      setCellValue(row, activeCell.rowIndex, column, await navigator.clipboard?.readText());
      render();
    };

    const moveRow = (rowIndex: number, direction: -1 | 1) => {
      const nextIndex = rowIndex + direction;
      if (nextIndex < 0 || nextIndex >= workingRows.length) return;
      const [row] = workingRows.splice(rowIndex, 1);
      workingRows.splice(nextIndex, 0, row);
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
      const columns = pivot.columns.filter((column) => !column.hidden && !hiddenColumnIds.has(column.id));
      const pageRows = props.pageSize ? pivot.rows.slice(pageIndex.value * props.pageSize, pageIndex.value * props.pageSize + props.pageSize) : pivot.rows;
      const root = document.createElement("div");
      root.className = "gridnexa-vue-grid";
      root.append(renderToolbar(columns, pivot.rows), renderTable(columns, pageRows));
      if (toolsOpen) root.appendChild(renderToolsPanel());
      root.appendChild(renderStatus(pivot.rows.length));
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
      const find = document.createElement("input");
      find.type = "search";
      find.placeholder = "Find cell";
      find.value = findText;
      find.style.cssText = "min-height:32px;padding:0 10px;border:1px solid #bfdbfe;border-radius:8px";
      find.addEventListener("input", () => {
        findText = find.value;
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
      actions.appendChild(find);
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

    const renderTable = (columns: Column<RowRecord>[], rows: RowRecord[]) => {
      const table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse";
      const thead = document.createElement("thead");
      const leading = Number(props.checkboxSelection) + Number(props.rowNumbers);
      if (props.mergedHeaders?.length) thead.appendChild(renderMergedHeaders(columns, leading));
      const header = document.createElement("tr");
      if (props.checkboxSelection) header.appendChild(cell("", "th"));
      if (props.rowNumbers) header.appendChild(cell("#", "th"));
      columns.forEach((column) => {
        const th = cell(`${column.headerName}${sortState?.columnId === column.id ? (sortState.direction === "asc" ? " ↑" : " ↓") : ""}`, "th");
        th.style.cssText = "padding:10px;border:1px solid #dbe3ef;background:#f8fbff;text-align:left";
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
        header.appendChild(th);
      });
      thead.appendChild(header);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      rows.forEach((row, rowIndex) => appendRow(tbody, row, rowIndex, columns, leading));
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

    const appendRow = (tbody: HTMLTableSectionElement, row: RowRecord, rowIndex: number, columns: Column<RowRecord>[], leading: number) => {
      const tr = document.createElement("tr");
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
        const td = cell(format(row, column, workingColumns));
        td.style.cssText = "padding:10px;border:1px solid #dbe3ef";
        if (activeCell?.rowIndex === rowIndex && activeCell.columnId === column.id) {
          td.style.outline = "2px solid #2563eb";
          td.style.outlineOffset = "-2px";
        }
        if (findText && format(row, column, workingColumns).toLowerCase().includes(findText.toLowerCase())) {
          td.style.background = "rgba(37,99,235,.1)";
        }
        if (props.getTreeDataPath && columnIndex === 0) td.style.paddingLeft = `${12 + Math.max(0, props.getTreeDataPath(row).length - 1) * 24}px`;
        td.addEventListener("click", () => {
          activeCell = { rowIndex, columnId: column.id };
          emit("cellClick", { row, rowIndex, column });
          render();
        });
        if (column.editable) td.addEventListener("dblclick", () => editCell(td, row, rowIndex, column));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      if (props.masterDetailRenderer) {
        const detailRow = document.createElement("tr");
        const detail = document.createElement("td");
        detail.colSpan = columns.length + leading;
        const content = props.masterDetailRenderer(row);
        content instanceof Node ? detail.appendChild(content) : detail.textContent = String(content ?? "");
        detailRow.appendChild(detail);
        tbody.appendChild(detailRow);
      }
    };

    const editCell = (td: HTMLTableCellElement, row: RowRecord, rowIndex: number, column: Column<RowRecord>) => {
      const oldValue = rawValue(row, column);
      const input = document.createElement("input");
      input.value = String(oldValue ?? "");
      td.replaceChildren(input);
      input.focus();
      input.addEventListener("blur", () => {
        const newValue = typeof oldValue === "number" ? Number(input.value) : input.value;
        setCellValue(row, rowIndex, column, newValue);
        render();
      }, { once: true });
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
        render();
      },
      { deep: true },
    );

    return () => h("div", { ref: host, class: "gridnexa-vue-host" });
  },
});

export default GridNexaVue;
