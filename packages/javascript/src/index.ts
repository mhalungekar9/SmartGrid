import type { Column, ColumnFilterModel, MergedHeader } from "@gridnexa/core";
export * from "@gridnexa/core";

export interface GridNexaJavaScriptOptions<T = Record<string, unknown>> {
  columns: Column<T>[];
  rows: T[];
  mergedHeaders?: MergedHeader[];
  rowNumbers?: boolean;
  checkboxSelection?: boolean;
  quickFilterText?: string;
  columnFilters?: Record<string, ColumnFilterModel>;
  getRowId?: (row: T, index: number) => string | number;
  onRowSelectionChange?: (rows: T[]) => void;
  onCellClick?: (params: { row: T; rowIndex: number; column: Column<T> }) => void;
}

type SortState = {
  columnId: string;
  direction: "asc" | "desc";
} | null;

const styleId = "gridnexa-javascript-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .gnx-grid {
      display: grid;
      border: 1px solid rgba(30, 64, 175, 0.16);
      border-radius: 12px;
      background: #fff;
      color: #0f172a;
      font: 14px/1.45 Inter, "Segoe UI", system-ui, sans-serif;
      overflow: auto;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
    }
    .gnx-table {
      width: 100%;
      min-width: max-content;
      border-collapse: separate;
      border-spacing: 0;
    }
    .gnx-table th,
    .gnx-table td {
      min-height: 42px;
      padding: 10px 12px;
      border-right: 1px solid rgba(30, 64, 175, 0.11);
      border-bottom: 1px solid rgba(30, 64, 175, 0.1);
      text-align: left;
      white-space: nowrap;
    }
    .gnx-table th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #f8fbff;
      color: #172033;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
      user-select: none;
    }
    .gnx-table thead tr:first-child th {
      top: 0;
      background: #e8f1ff;
      color: #153e90;
      text-align: center;
    }
    .gnx-table tbody tr:hover td {
      background: rgba(37, 99, 235, 0.07);
    }
    .gnx-control-cell {
      width: 44px;
      text-align: center !important;
    }
    .gnx-empty {
      padding: 18px;
      color: #64748b;
    }
  `;
  document.head.appendChild(style);
}

function getValue<T>(row: T, column: Column<T>) {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }

  return row[column.field];
}

function formatValue<T>(row: T, column: Column<T>) {
  const value = getValue(row, column);

  if (column.valueFormatter) {
    return column.valueFormatter(value);
  }

  return value == null ? "" : String(value);
}

function getFilterText<T>(row: T, column: Column<T>) {
  return String(getValue(row, column) ?? "").toLowerCase();
}

function matchesColumnFilter<T>(
  row: T,
  column: Column<T>,
  filter: ColumnFilterModel,
) {
  const text = getFilterText(row, column);
  const value = filter.value == null ? "" : String(filter.value).toLowerCase();

  if (!value && !(filter.values?.length)) {
    return true;
  }

  switch (filter.operator) {
    case "equals":
      return text === value;
    case "startsWith":
      return text.startsWith(value);
    case "endsWith":
      return text.endsWith(value);
    case "in":
      return (filter.values ?? []).map(String).includes(String(getValue(row, column)));
    default:
      return text.includes(value);
  }
}

function compareRows<T>(columns: Column<T>[], sort: SortState) {
  return (left: T, right: T) => {
    if (!sort) {
      return 0;
    }

    const column = columns.find((entry) => entry.id === sort.columnId);

    if (!column) {
      return 0;
    }

    const leftValue = getValue(left, column);
    const rightValue = getValue(right, column);
    const result =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue ?? "").localeCompare(String(rightValue ?? ""));

    return sort.direction === "asc" ? result : -result;
  };
}

function createCell(text: string, tagName: "td" | "th" = "td") {
  const cell = document.createElement(tagName);
  cell.textContent = text;

  return cell;
}

export class GridNexaGrid<T = Record<string, unknown>> {
  private options: GridNexaJavaScriptOptions<T>;
  private sortState: SortState = null;
  private selectedIds = new Set<string | number>();

  constructor(
    private readonly container: HTMLElement,
    options: GridNexaJavaScriptOptions<T>,
  ) {
    this.options = options;
    injectStyles();
    this.render();
  }

  update(options: Partial<GridNexaJavaScriptOptions<T>>) {
    this.options = {
      ...this.options,
      ...options,
    };
    this.render();
  }

  destroy() {
    this.container.replaceChildren();
    this.selectedIds.clear();
  }

  private getRowId(row: T, index: number) {
    return this.options.getRowId?.(row, index) ?? index;
  }

  private getVisibleRows() {
    const {
      columnFilters = {},
      columns,
      quickFilterText = "",
      rows,
    } = this.options;
    const query = quickFilterText.trim().toLowerCase();

    return rows
      .filter((row) => {
        const quickMatch =
          !query ||
          columns.some((column) => !column.hidden && getFilterText(row, column).includes(query));

        if (!quickMatch) {
          return false;
        }

        return Object.entries(columnFilters).every(([columnId, filter]) => {
          const column = columns.find((entry) => entry.id === columnId);

          return column ? matchesColumnFilter(row, column, filter) : true;
        });
      })
      .slice()
      .sort(compareRows(columns, this.sortState));
  }

  private toggleSort(columnId: string) {
    this.sortState =
      this.sortState?.columnId !== columnId
        ? { columnId, direction: "asc" }
        : this.sortState.direction === "asc"
          ? { columnId, direction: "desc" }
          : null;
    this.render();
  }

  private emitSelection(rows: T[]) {
    this.options.onRowSelectionChange?.(
      rows.filter((row, index) => this.selectedIds.has(this.getRowId(row, index))),
    );
  }

  render() {
    const columns = this.options.columns.filter((column) => !column.hidden);
    const rows = this.getVisibleRows();
    const root = document.createElement("div");
    root.className = "gnx-grid";
    const table = document.createElement("table");
    table.className = "gnx-table";
    const thead = document.createElement("thead");
    const leadingColumnCount =
      Number(this.options.rowNumbers) + Number(this.options.checkboxSelection);

    if (this.options.mergedHeaders?.length) {
      const row = document.createElement("tr");

      if (leadingColumnCount) {
        const spacer = createCell("", "th");
        spacer.colSpan = leadingColumnCount;
        row.appendChild(spacer);
      }

      this.options.mergedHeaders.forEach((header) => {
        const visibleCount = header.columnIds.filter((columnId) =>
          columns.some((column) => column.id === columnId),
        ).length;

        if (!visibleCount) {
          return;
        }

        const cell = createCell(header.headerName, "th");
        cell.colSpan = visibleCount;
        row.appendChild(cell);
      });

      thead.appendChild(row);
    }

    const headerRow = document.createElement("tr");

    if (this.options.checkboxSelection) {
      headerRow.appendChild(createCell("", "th")).className = "gnx-control-cell";
    }

    if (this.options.rowNumbers) {
      headerRow.appendChild(createCell("#", "th")).className = "gnx-control-cell";
    }

    columns.forEach((column) => {
      const th = createCell(column.headerName, "th");

      if (column.width) {
        th.style.width = `${column.width}px`;
      }

      th.addEventListener("click", () => {
        if (column.sortable !== false) {
          this.toggleSort(column.id);
        }
      });
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const rowId = this.getRowId(row, rowIndex);

      if (this.options.checkboxSelection) {
        const td = document.createElement("td");
        td.className = "gnx-control-cell";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = this.selectedIds.has(rowId);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            this.selectedIds.add(rowId);
          } else {
            this.selectedIds.delete(rowId);
          }

          this.emitSelection(rows);
        });
        td.appendChild(checkbox);
        tr.appendChild(td);
      }

      if (this.options.rowNumbers) {
        tr.appendChild(createCell(String(rowIndex + 1))).className = "gnx-control-cell";
      }

      columns.forEach((column) => {
        const td = createCell(formatValue(row, column));
        td.addEventListener("click", () => {
          this.options.onCellClick?.({ row, rowIndex, column });
        });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    root.appendChild(table);

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "gnx-empty";
      empty.textContent = "No rows to show";
      root.appendChild(empty);
    }

    this.container.replaceChildren(root);
  }
}

export function createGridNexa<T>(
  container: HTMLElement,
  options: GridNexaJavaScriptOptions<T>,
) {
  return new GridNexaGrid(container, options);
}
