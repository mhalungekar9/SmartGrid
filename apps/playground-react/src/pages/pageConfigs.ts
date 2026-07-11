import type { AdvancedFilterModel, ColumnFilterModel, Column, GridNexaFillWidthOptions, GridNexaSidePanelOptions, GridNexaToolbarOptions, MergedHeader, PivotAggregation } from "@gridnexa/react";
import { compactEmployeeColumns, employeeColumns, employees, formulaEmployeeColumns, readonlyEmployeeColumns, type Employee } from "../data/employees";
import { treeColumns, treeRows } from "../data/treeData";

export interface FeatureConfig {
  title: string;
  subtitle: string;
  overview: string;
  notes: string[];
  details?: string[];
  code: string;
  columns?: Column<Employee>[];
  rows?: Employee[];
  mergedHeaders?: MergedHeader[];
  checkboxSelection?: boolean;
  rowNumbers?: boolean;
  enableRowReorder?: boolean;
  pageSize?: number;
  quickFilterText?: string;
  columnFilters?: Record<string, ColumnFilterModel>;
  advancedFilterModel?: AdvancedFilterModel;
  toolbar?: GridNexaToolbarOptions;
  sidePanel?: GridNexaSidePanelOptions;
  fillWidth?: GridNexaFillWidthOptions;
  height?: number | string;
  columnTools?: boolean | Record<string, boolean>;
  textDisplay?: { overflow?: "ellipsis" | "wrap" | "clip"; showTooltip?: boolean };
  createRow?: () => Employee;
  groupBy?: keyof Employee & string;
  pivotBy?: keyof Employee & string;
  pivotValueColumns?: Array<keyof Employee & string>;
  pivotAggregation?: PivotAggregation;
  treeData?: boolean;
  masterDetail?: boolean;
  transaction?: boolean;
  serverEvents?: boolean;
  cellEvents?: boolean;
}

const columnMergeColumns = employeeColumns
  .filter((column) => ["name", "department", "city", "active", "score"].includes(column.id))
  .map((column) => ({ ...column, pinned: undefined }));

export const featureConfigs = {
  basicGrid: {
    title: "Basic Grid",
    subtitle: "Foundation",
    overview: "Render typed rows and columns with sorting, filtering metadata, pinned columns, value formatting, and package CSS loaded like an external app.",
    notes: ["import index.css", "all toolbar tools", "column tools", "drag reorder", "add/delete rows", "scrollbar", "ellipsis tooltip"],
    columns: compactEmployeeColumns.map((column) =>
      column.id === "name"
        ? { ...column, width: undefined, minWidth: 180, textDisplay: { overflow: "ellipsis", showTooltip: true } }
        : column,
    ),
    checkboxSelection: true,
    rowNumbers: true,
    enableRowReorder: true,
    height: 420,
    columnTools: {
      sort: true,
      filter: true,
      filterPanel: true,
      menu: true,
      resize: true,
      pin: true,
      hide: true,
      autosize: true,
      columnSelector: true,
    },
    textDisplay: { overflow: "ellipsis", showTooltip: true },
    toolbar: {
      saveAll: true,
      undoRedo: true,
      filters: true,
      advancedFilter: true,
      columnSelector: true,
      quickFilter: true,
      exportCsv: true,
      exportExcel: true,
      prevNextPage: true,
      find: true,
      columns: true,
      fill: true,
      addRow: true,
      deleteRow: true,
      deleteSelectedRows: true,
    },
    sidePanel: {
      columns: true,
      pivot: true,
      filters: true,
    },
    createRow: () => ({
      id: Date.now(),
      name: "New employee",
      age: 0,
      department: "Operations",
      city: "London",
      hired: new Date().toISOString().slice(0, 10),
      region: "EMEA",
      active: true,
      score: 0,
      manager: "Unassigned",
      adjustedScore: "=score * 1.05",
    }),
    code: `import { GridNexa, type Column } from "@gridnexa/react";
import "@gridnexa/react/index.css";

const toolbar = {
  saveAll: true,
  undoRedo: true,
  filters: true,
  advancedFilter: true,
  columnSelector: true,
  quickFilter: true,
  exportCsv: true,
  exportExcel: true,
  prevNextPage: true,
  find: true,
  columns: true,
  fill: true,
  addRow: true,
  deleteRow: true,
  deleteSelectedRows: true,
};

<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  height={420}
  checkboxSelection
  rowNumbers
  enableRowReorder
  toolbar={toolbar}
  columnTools={{
    sort: true,
    filter: true,
    filterPanel: true,
    menu: true,
    resize: true,
    pin: true,
    hide: true,
    autosize: true,
    columnSelector: true
  }}
  sidePanel={{
    columns: true,
    pivot: true,
    filters: true
  }}
  textDisplay={{ overflow: "ellipsis", showTooltip: true }}
  createRow={() => ({
    id: Date.now(),
    name: "New employee",
    age: 0,
    department: "Operations",
    city: "London",
    hired: new Date().toISOString().slice(0, 10),
    region: "EMEA",
    active: true,
    score: 0,
    manager: "Unassigned",
    adjustedScore: "=score * 1.05"
  })}
  onRowAdd={(event) => console.info("Row added", event)}
  onRowDelete={(event) => console.info("Row deleted", event)}
  onRowsDelete={(event) => console.info("Rows deleted", event)}
  onDataChange={(event) => console.info("Data changed", event)}
  onColumnMoved={(event) => console.info("Column moved", event)}
/>`,
  },
  sorting: {
    title: "Sorting",
    subtitle: "Column interactions",
    overview: "Click the header sort controls or open a column menu to sort ascending, descending, or clear sorting.",
    notes: ["header sort", "column menu", "numeric sorting"],
    columns: employeeColumns,
    code: `<GridNexa
  columns={columns.map((column) => ({
    ...column,
    sortable: true
  }))}
  rows={rows}
/>`,
  },
  filtering: {
    title: "Filtering",
    subtitle: "Search, column filters, and advanced builder",
    overview: "Combine quick filtering, per-column filters, and a visual advanced filter builder with nested AND/OR rule groups.",
    notes: ["quick filter", "set filters", "advanced builder", "nested AND/OR"],
    details: [
      "Open Advanced in the grid toolbar to build grouped rules without writing predicate code.",
      "Use Match all rules for AND logic or Match any rule for OR logic, then add rules or nested groups.",
      "The advancedFilterModel prop is serializable, so you can save it, restore it, or send it to a server.",
    ],
    quickFilterText: "engineering",
    toolbar: {
      summary: true,
      quickFilter: true,
      filters: true,
      advancedFilter: true,
    },
    columnFilters: {
      score: { type: "number", operator: "gte", value: 85 },
    },
    advancedFilterModel: {
      kind: "group",
      joinOperator: "and",
      conditions: [
        {
          kind: "rule",
          columnId: "region",
          operator: "equals",
          value: "EMEA",
        },
        {
          kind: "group",
          joinOperator: "or",
          conditions: [
            {
              kind: "rule",
              columnId: "active",
              operator: "equals",
              value: true,
            },
            {
              kind: "rule",
              columnId: "score",
              operator: "gte",
              value: 90,
            },
          ],
        },
      ],
    },
    code: `<GridNexa
  columns={columns}
  rows={rows}
  quickFilterText="engineering"
  columnFilters={{
    score: { type: "number", operator: "gte", value: 85 }
  }}
  advancedFilterModel={{
    kind: "group",
    joinOperator: "and",
    conditions: [
      { kind: "rule", columnId: "region", operator: "equals", value: "EMEA" },
      {
        kind: "group",
        joinOperator: "or",
        conditions: [
          { kind: "rule", columnId: "active", operator: "equals", value: true },
          { kind: "rule", columnId: "score", operator: "gte", value: 90 }
        ]
      }
    ]
  }}
  onAdvancedFilterModelChange={(model) => saveFilter(model)}
/>`,
  },
  pagination: {
    title: "Pagination",
    subtitle: "Rows per page",
    overview: "Use pageSize to show a pager in the grid toolbar and keep larger datasets easier to scan.",
    notes: ["pageSize", "toolbar pager", "row numbers"],
    pageSize: 4,
    rowNumbers: true,
    toolbar: {
      summary: true,
      pagination: true,
    },
    code: `<GridNexa
  columns={columns}
  rows={rows}
  pageSize={4}
  rowNumbers
/>`,
  },
  selection: {
    title: "Selection",
    subtitle: "Checkbox column",
    overview: "Enable a first-column checkbox with row selection, select all, and stable ids through getRowId.",
    notes: ["checkboxSelection", "select all", "getRowId"],
    checkboxSelection: true,
    rowNumbers: true,
    toolbar: {
      summary: true,
      exportCsv: true,
      exportExcel: true,
    },
    code: `<GridNexa
  columns={columns}
  rows={rows}
  checkboxSelection
  rowNumbers
  getRowId={(row) => row.id}
  onRowSelectionChange={(rows) => setSelectedRows(rows)}
/>`,
  },
  rowReorder: {
    title: "Row Reorder",
    subtitle: "Drag or click",
    overview: "Let users rearrange rows by dragging a row or by using the up/down controls that appear on hover.",
    notes: ["drag rows", "hover controls", "order updates"],
    details: [
      "Drag any data row and drop it onto another visible row to reorder the underlying rows.",
      "Hover a row to reveal up and down buttons for precise keyboard-friendly movement.",
      "Pinned columns, selection, filters, and exports follow the updated row order.",
    ],
    checkboxSelection: true,
    rowNumbers: true,
    enableRowReorder: true,
    code: `<GridNexa
  columns={columns}
  rows={rows}
  rowNumbers
  checkboxSelection
  enableRowReorder
  getRowId={(row) => row.id}
  onRowOrderChange={(event) => saveRowOrder(event.rows)}
/>

// Users can drag rows, or hover a row and use the up/down buttons.`,
  },
  columnResize: {
    title: "Column Resize",
    subtitle: "Layout control",
    overview: "Drag header resize handles or double-click them to auto-size columns based on visible content.",
    notes: ["drag resize", "auto-size", "width props"],
    code: `<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Name", width: 240 },
    { id: "department", field: "department", headerName: "Department", width: 210 }
  ]}
  rows={rows}
/>`,
  },
  columnReorder: {
    title: "Column Reorder",
    subtitle: "Drag and drop",
    overview: "Drag a column header and drop it on another header to reorder columns directly in the grid.",
    notes: ["import package CSS", "drag header", "aligned preview", "before/after drop", "pin-aware lanes"],
    details: [
      "External React apps should import @gridnexa/react/index.css so drag handles, header layout, and drop indicators match the playground.",
      "Users can drag from the header label area without disturbing sort, filter, menu, or resize controls.",
      "The drag preview uses the real header cell dimensions and the drop indicator tracks before or after the target header.",
      "Pinned-left, center, and pinned-right columns reorder within their current lane.",
      "The rendered cells, header, export order, and column chooser all follow the updated order.",
    ],
    code: `import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

<GridNexa
  columns={columns}
  rows={rows}
  onColumnMoved={(event) => console.info("Column moved", event)}
/>

// Drag the Name, Department, City, or Score header to change column order.
// Pinning still works from each column menu.`,
  },
  columnMerge: {
    title: "Column Merge",
    subtitle: "Grouped headers",
    overview: "Create Excel-style merged header cells that span any number of adjacent columns and label related fields.",
    notes: ["mergedHeaders", "spans columns", "custom header text"],
    details: [
      "Use mergedHeaders to render a top header band above the normal column headers.",
      "Each merged header receives stable column ids; GridNexa calculates the span from the current visible column order.",
      "Merged headers continue to track column resize, hide/show, pinning lanes, and column reordering.",
    ],
    mergedHeaders: [
      {
        id: "person",
        headerName: "Employee Profile",
        columnIds: ["name", "department", "city"],
      },
      {
        id: "performance",
        headerName: "Performance",
        columnIds: ["active", "score"],
      },
    ],
    columns: columnMergeColumns,
    code: `import { GridNexa, type Column, type MergedHeader } from "@gridnexa/react";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  active: boolean;
  score: number;
}

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220 },
  { id: "department", field: "department", headerName: "Department", width: 210 },
  { id: "city", field: "city", headerName: "City", width: 170 },
  { id: "active", field: "active", headerName: "Active", width: 120 },
  { id: "score", field: "score", headerName: "Score", width: 130 }
];

const mergedHeaders: MergedHeader[] = [
  {
    id: "profile",
    headerName: "Employee Profile",
    columnIds: ["name", "department", "city"]
  },
  {
    id: "performance",
    headerName: "Performance",
    columnIds: ["active", "score"],
    align: "center"
  }
];

export function MergedHeaderGrid() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      mergedHeaders={mergedHeaders}
      getRowId={(row) => row.id}
    />
  );
}`,
  },
  frozenColumns: {
    title: "Frozen Columns",
    subtitle: "Pinned layout",
    overview: "Pin important fields to the left or right so identity and metrics stay visible while scrolling.",
    notes: ["pinned left", "pinned right", "sticky cells"],
    columns: employeeColumns,
    code: `const columns = [
  { id: "name", field: "name", headerName: "Name", pinned: "left" },
  { id: "score", field: "score", headerName: "Score", pinned: "right" }
];

<GridNexa columns={columns} rows={rows} />`,
  },
  templates: {
    title: "Templates",
    subtitle: "Rendering",
    overview: "Use valueFormatter and cellRenderer to display rich domain-specific cell content.",
    notes: ["cellRenderer", "valueFormatter", "badges"],
    columns: readonlyEmployeeColumns.map((column) =>
      column.id === "active"
        ? {
            ...column,
            cellRenderer: (value) => value ? "Active" : "Inactive",
          }
        : column,
    ),
    code: `<GridNexa
  columns={[
    {
      id: "active",
      field: "active",
      headerName: "Active",
      cellRenderer: (value) => value ? "Active" : "Inactive"
    }
  ]}
  rows={rows}
/>`,
  },
  editing: {
    title: "Editing",
    subtitle: "Inline changes",
    overview: "Configure text, number, date, checkbox, select, and advanced select editors per column.",
    notes: ["inline edit", "undo/redo", "fill handle"],
    cellEvents: true,
    code: `<GridNexa
  columns={editableColumns}
  rows={rows}
  enableUndoRedo
  enableFillHandle
  onCellValueChange={(params) => console.log(params)}
/>`,
  },
  formulas: {
    title: "Formulas",
    subtitle: "Calculated cells",
    overview: "Use formula strings that start with '=' to calculate values from other numeric fields in the same row.",
    notes: ["=score * 1.05", "calculated display", "editable formula"],
    details: [
      "Any string value that begins with '=' is evaluated by GridNexa before display.",
      "Formula expressions can reference numeric row fields such as score, age, or other metrics.",
      "Invalid expressions render as #FORMULA!, which makes data issues visible to users.",
    ],
    columns: formulaEmployeeColumns,
    code: `interface Employee {
  id: number;
  name: string;
  department: string;
  score: number;
  adjustedScore: string;
}

const rows: Employee[] = [
  {
    id: 1,
    name: "John Carter",
    department: "Operations",
    score: 92,
    adjustedScore: "=score * 1.05"
  }
];

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220 },
  { id: "score", field: "score", headerName: "Base Score", width: 140 },
  {
    id: "adjustedScore",
    field: "adjustedScore",
    headerName: "Formula",
    editable: true,
    editor: "text"
  },
  {
    id: "calculatedScore",
    field: "adjustedScore",
    headerName: "Calculated",
    valueFormatter: (value) =>
      typeof value === "number" ? value.toFixed(1) : String(value ?? "")
  }
];

export function FormulaGridExample() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
    />
  );
}`,
  },
  treeGrid: {
    title: "Tree Grid",
    subtitle: "Hierarchical data",
    overview: "Provide getTreeDataPath to turn flat rows into expandable hierarchy levels.",
    notes: ["getTreeDataPath", "expand/collapse", "nested rows"],
    columns: treeColumns,
    rows: treeRows,
    treeData: true,
    code: `<GridNexa
  columns={columns}
  rows={rows}
  getTreeDataPath={(row) => [
    row.region,
    row.department,
    row.name
  ]}
/>`,
  },
  grouping: {
    title: "Grouping",
    subtitle: "Grouped rows",
    overview: "Group rows by a field and let users expand or collapse each bucket.",
    notes: ["groupBy", "summaries", "collapsible"],
    groupBy: "department",
    masterDetail: true,
    code: `<GridNexa
  columns={columns}
  rows={rows}
  groupBy="department"
  masterDetailRenderer={(row) => <EmployeeDetail row={row} />}
/>`,
  },
  aggregates: {
    title: "Pivoting & Aggregates",
    subtitle: "Cross-tab summaries",
    overview: "Turn row-level data into a pivot table by grouping departments, splitting measures by region, aggregating score metrics, and letting users adjust the pivot from the right-side toolbar.",
    notes: ["right toolbar", "pivot mode", "row groups", "values"],
    details: [
      "Open the Columns tab on the right side of the grid and enable Pivot Mode.",
      "Choose a Row Group, Pivot Column, Value fields, and aggregation without changing application code.",
      "Use onPivotModelChange to persist user choices or send them to a server-side datasource.",
      "Supported aggregations include sum, avg, count, min, and max.",
    ],
    groupBy: "department",
    pivotBy: "region",
    pivotValueColumns: ["score"],
    pivotAggregation: "avg" as PivotAggregation,
    code: `type PivotAggregation = "sum" | "avg" | "count" | "min" | "max";

const columns = [
  { id: "department", field: "department", headerName: "Department" },
  { id: "region", field: "region", headerName: "Region" },
  { id: "score", field: "score", headerName: "Score", filter: "number" }
];

const rows = [
  { id: 1, department: "Engineering", region: "EMEA", score: 96 },
  { id: 2, department: "Engineering", region: "Americas", score: 89 },
  { id: 3, department: "Finance", region: "APAC", score: 84 }
];

<GridNexa
  columns={columns}
  rows={rows}
  groupBy="department"
  pivotBy="region"
  pivotValueColumns={["score"]}
  pivotAggregation={"avg" as PivotAggregation}
  onPivotModelChange={(model) => savePivotModel(model)}
/>`,
  },
  virtualScrolling: {
    title: "Virtual Scrolling",
    subtitle: "Large lists",
    overview: "Use a fixed grid height for production scrolling so the header and body stay aligned inside one scroll container. A row-window virtualizer can be layered on this contract without changing the public API.",
    notes: ["height={420}", "stable getRowId", "aligned header/body scroll"],
    height: 420,
    fillWidth: true,
    rows: Array.from({ length: 1000 }, (_, index) => ({
      ...employees[index % employees.length],
      id: index + 1,
      name: `${employees[index % employees.length].name} ${index + 1}`,
      score: 70 + (index % 30),
    })),
    code: `<GridNexa
  columns={columns}
  rows={largeRows}
  getRowId={(row) => row.id}
  height={420}
  fillWidth
/>`,
  },
  remoteData: {
    title: "Remote Data",
    subtitle: "Server operations",
    overview: "Listen to sort, filter, selection, paging, grouping, and transaction state for API-backed grids.",
    notes: ["onServerSideOperation", "state payload", "API ready"],
    serverEvents: true,
    pageSize: 4,
    code: `<GridNexa
  columns={columns}
  rows={rows}
  pageSize={4}
  onServerSideOperation={(state) => {
    fetchRows(state);
  }}
/>`,
  },
  export: {
    title: "Export",
    subtitle: "CSV and Excel",
    overview: "Use the built-in toolbar export actions to download the current visible rows.",
    notes: ["Export CSV", "Export Excel", "visible rows"],
    rowNumbers: true,
    code: `<GridNexa
  columns={columns}
  rows={rows}
/>

// Users can export from the grid toolbar.`,
  },
  theme: {
    title: "Theme",
    subtitle: "Light and dark",
    overview: "Switch between light and dark mode to see how GridNexa fits polished product interfaces.",
    notes: ["Bootstrap theme", "CSS variables", "GridNexa classes"],
    details: [
      "Set Bootstrap's data-bs-theme and your own app theme attribute from the same theme state.",
      "Override GridNexa surface variables such as --sg-pinned-bg and --sg-pinned-border near the grid wrapper.",
      "Use GridNexa class selectors for toolbar, header, row, cell, status bar, and filter panel styling.",
    ],
    checkboxSelection: true,
    rowNumbers: true,
    code: `import { useEffect, useState } from "react";
import { GridNexa } from "@gridnexa/react";

type ThemeName = "light" | "dark";

export function ThemedGrid() {
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
    document.documentElement.dataset.appTheme = theme;
  }, [theme]);

  return (
    <section className="grid-theme-surface">
      <button
        className="btn btn-primary mb-3"
        type="button"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        Toggle theme
      </button>

      <GridNexa columns={columns} rows={rows} getRowId={(row) => row.id} />
    </section>
  );
}

/* CSS customization */
.grid-theme-surface {
  --sg-pinned-bg: #ffffff;
  --sg-pinned-border: rgba(15, 23, 42, 0.12);
}

[data-app-theme="light"] .sg-grid-root {
  border-color: rgba(15, 23, 42, 0.12);
  background: #ffffff;
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.14);
}

[data-app-theme="light"] .sg-header,
[data-app-theme="light"] .sg-header-cell {
  background: #f8fafc;
  color: #0f172a;
}

[data-app-theme="light"] .sg-cell {
  background: #ffffff;
  color: #182230;
}`,
  },
  events: {
    title: "Events",
    subtitle: "Callbacks",
    overview: "React to row, cell, selection, column, filter, sort, export, save, and server-side operation events from parent components.",
    notes: ["selection events", "cell lifecycle", "save all", "column state"],
    checkboxSelection: true,
    rowNumbers: true,
    enableRowReorder: true,
    cellEvents: true,
    serverEvents: true,
    toolbar: {
      summary: true,
      filters: true,
      advancedFilter: true,
      columns: true,
      exportCsv: true,
      exportExcel: true,
      saveAll: true,
    },
    code: `<GridNexa
  columns={columns}
  rows={rows}
  checkboxSelection
  rowNumbers
  enableRowReorder
  toolbar={{ saveAll: true }}
  getRowId={(row) => row.id}
  onSelectedRowChange={({ row }) => console.log("selected row", row)}
  onRowSelected={(event) => console.log("row selected", event)}
  onSelectionChanged={(event) => console.log("selection", event)}
  onRowClick={(event) => console.log("row click", event)}
  onRowDoubleClick={(event) => console.log("row double click", event)}
  onRowOrderChange={(event) => console.log("row order", event.rows)}
  onCellClick={(event) => console.log("cell click", event)}
  onCellDoubleClick={(event) => console.log("cell double click", event)}
  onCellEditStart={(event) => console.log("edit start", event)}
  onCellEditStop={(event) => console.log("edit stop", event)}
  onCellValueChange={(event) => console.log(event)}
  onRowSelectionChange={(rows) => console.log("selected rows", rows)}
  onSortChanged={(model) => console.log("sort", model)}
  onFilterChanged={(model) => console.log("filters", model)}
  onColumnMoved={(event) => console.log("column moved", event)}
  onColumnResized={(event) => console.log("column resized", event)}
  onColumnVisible={(event) => console.log("column visible", event)}
  onColumnPinned={(event) => console.log("column pinned", event)}
  onCopy={(event) => console.log("copy", event)}
  onPaste={(event) => console.log("paste", event)}
  onExport={(event) => console.log("export", event)}
  onSaveAll={(event) => console.log("save all", event.rows)}
  onServerSideOperation={(state) => console.log(state)}
/>`,
  },
  performance: {
    title: "Performance",
    subtitle: "Production posture",
    overview: "Combine row ids, virtualization, paging, and focused column models for fast production grids.",
    notes: ["getRowId", "virtualized body", "focused columns"],
    rows: Array.from({ length: 240 }, (_, index) => ({
      ...employees[index % employees.length],
      id: index + 1,
      name: `${employees[index % employees.length].name} ${index + 1}`,
      score: 75 + (index % 24),
    })),
    columns: compactEmployeeColumns,
    checkboxSelection: true,
    code: `<GridNexa
  columns={compactColumns}
  rows={largeRows}
  getRowId={(row) => row.id}
  checkboxSelection
/>`,
  },
  transaction: {
    title: "Transactions",
    subtitle: "Row updates",
    overview: "Apply add, update, and remove transactions without rebuilding the whole grid setup.",
    notes: ["add rows", "update rows", "transaction prop"],
    transaction: true,
    code: `<GridNexa
  columns={columns}
  rows={rows}
  transaction={{
    update: [{ ...rows[1], score: 95 }],
    add: [newEmployee]
  }}
/>`,
  },
} satisfies Record<string, FeatureConfig>;
