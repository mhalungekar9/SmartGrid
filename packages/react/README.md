# GridNexa React Data Grid | React Table

Enterprise React data grid with Excel-like features, AI command support, theme-ready styling, and copy-ready TypeScript APIs.

[![npm](https://img.shields.io/npm/v/@gridnexa/react?color=0ea5e9)](https://www.npmjs.com/package/@gridnexa/react)
[![license](https://img.shields.io/npm/l/@gridnexa/react)](https://github.com/mhalungekar9/SmartGrid)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

GridNexa gives React teams a polished grid foundation for data-heavy products: sorting, filtering, editing, formulas, grouping, pivoting, tree data, selection, export, styling hooks, and safe AI-generated grid actions.

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid

## Install

```bash
npm install @gridnexa/react
```

```bash
pnpm add @gridnexa/react
```

## Basic Usage

```tsx
import { GridNexa, type Column } from "@gridnexa/react";
import "@gridnexa/react/index.css";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  score: number;
  adjustedScore: string;
}

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", width: 220, sortable: true, filter: "text", editable: true },
  { id: "department", field: "department", headerName: "Department", width: 180, filter: "set" },
  { id: "city", field: "city", headerName: "City", width: 160, filter: "set" },
  { id: "score", field: "score", headerName: "Score", width: 120, filter: "number", editable: true },
  { id: "adjustedScore", field: "adjustedScore", headerName: "Adjusted", width: 150 },
];

const rows: Employee[] = [
  { id: 1, name: "John Carter", department: "Operations", city: "London", score: 92, adjustedScore: "=score * 1.05" },
  { id: 2, name: "Alice Moreau", department: "Product", city: "Paris", score: 87, adjustedScore: "=score * 1.05" },
];

export function App() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      rowNumbers
      checkboxSelection
      enableRangeSelection
      enableFillHandle
      enableUndoRedo
      pageSize={20}
      theme="light"
      density="standard"
      fillWidth={false}
      getRowId={(row) => row.id}
    />
  );
}
```

GridNexa ships with runtime styles, but installed React apps should also import `@gridnexa/react/index.css`. That CSS export keeps header layout, drag handles, column reorder drop indicators, pinned columns, popovers, scrollbars, and default themes identical to the playground. You can pass `unstyled` when your design system owns every rule.

## External React App Checklist

```tsx
import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";
```

- Rebuild and reinstall the package after upgrading so the external app receives the latest `dist/index.css`.
- Keep the CSS import once in your app entry file, such as `main.tsx`, `App.tsx`, or your design-system wrapper.
- Column drag/reorder works from the header label area. The preview uses the real header width, and the drop indicator tracks whether the column will move before or after the target.
- Pinned-left, center, and pinned-right columns reorder within their current lane.

## Toolbar, Header Tools, Footer, And Icons

```tsx
<GridNexa
  columns={[
    {
      id: "name",
      field: "name",
      headerName: "Name",
      tools: { filter: false, filterPanel: false },
      icons: { menu: "..." },
    },
  ]}
  rows={rows}
  toolbar={{
    quickFilter: true,
    find: true,
    filters: true,
    advancedFilter: true,
    columns: true,
    addRow: true,
    deleteRow: true,
    deleteSelectedRows: true,
    exportCsv: true,
    exportExcel: true,
  }}
  columnTools={{
    sort: true,
    filter: true,
    filterPanel: true,
    menu: true,
    resize: true,
    pin: true,
    hide: true,
    autosize: true,
  }}
  footer={{
    rowCount: true,
    selectedRows: true,
    selectedCell: true,
    selectedRange: true,
    filterCount: true,
    sortStatus: true,
    pagination: true,
  }}
  sidePanel={{
    columns: true,
    pivot: true,
    filters: true,
    defaultActivePanel: "columns",
  }}
  icons={{
    sortAsc: "A+",
    sortDesc: "Z+",
    filter: "F",
    menu: "...",
    pagePrevious: "<",
    pageNext: ">",
    addRow: "+",
    deleteRow: "-",
  }}
/>
```

Use `columnTools` for global header-button defaults and `column.tools` for per-column overrides. Supported header tools include `sort`, `filter`, `filterPanel`, `menu`, `resize`, `pin`, `hide`, and `autosize`.

Use `footer={false}` to hide the footer or pass a footer object to choose row count, selected rows, selected cell, selected range, filter count, sort status, and pagination. For full control, pass `footer={{ renderer: (state) => <YourFooter {...state} /> }}`.

Use `sidePanel={false}` or `sidePanel={{ enabled: false }}` to hide the right-side tools. Use `sidePanel={{ columns, pivot, filters, defaultActivePanel }}` to show only the Columns/Pivot or Filters tab and optionally open `"columns"`, `"pivot"`, or `"filters"` by default. On mobile and tablet widths, the side tools become horizontal tabs and the open panel behaves like a bottom sheet.

Custom icons can be supplied globally through `icons` or per column through `column.icons`. Missing icons fall back to GridNexa defaults.

## Presets, Saved Views, And Overlays

```tsx
<GridNexa columns={columns} rows={rows} preset="admin" />
<GridNexa columns={columns} rows={rows} preset="spreadsheet" />
<GridNexa columns={columns} rows={rows} preset="analytics" />
```

Presets provide sensible defaults for common product screens without taking away control. Any explicit prop you pass still wins over the preset.

```tsx
<GridNexa
  columns={columns}
  rows={rows}
  preset="admin"
  stateStorage={{
    key: "employees-grid",
    type: "localStorage",
  }}
/>
```

`stateStorage` persists practical saved-view state such as column order, widths, hidden columns, pinned columns, filters, and sort state. Use `persist` to choose slices: `"columns"`, `"filters"`, `"sort"`, `"pagination"`, and `"sidePanel"`.

```tsx
<GridNexa
  columns={columns}
  rows={rows}
  loading={isLoading}
  error={error}
  emptyState="No employees found"
/>
```

Built-in overlays cover loading, error, and empty states inside the grid viewport, so product apps do not need wrapper logic for common states.

## Column And Range Summaries

Copy this:

```tsx
<GridNexa
  columns={columns}
  rows={rows}
  enableRangeSelection
  summaries={{
    footer: true,
    selectedRange: true,
  }}
/>
```

When to use:

Use summaries when users compare numeric data, audit selected cells, or need spreadsheet-style feedback without exporting to Excel. Footer summaries calculate visible numeric values; selected range summaries calculate the active range.

Common mistakes:

- Forgetting `enableRangeSelection` when expecting selected range summaries.
- Expecting text columns to be included; summaries intentionally ignore non-numeric values.
- Hiding the footer with `footer={false}` and then expecting summary text to appear.

External app setup:

```tsx
import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";
```

Next.js example:

```tsx
"use client";

import { GridNexa } from "@gridnexa/react";
import "@gridnexa/react/index.css";

export default function EmployeesGrid() {
  return (
    <GridNexa
      columns={columns}
      rows={rows}
      enableRangeSelection
      summaries={{ footer: true, selectedRange: true }}
    />
  );
}
```

## Column Width And Fill Behavior

```tsx
<GridNexa
  columns={[
    { id: "name", field: "name", headerName: "Name", width: 180 },
    { id: "department", field: "department", headerName: "Department", flex: 1, minWidth: 180 },
    { id: "notes", field: "notes", headerName: "Notes", flex: 2, minWidth: 240 },
  ]}
  rows={rows}
  fillWidth={{ enabled: true, mode: "flex" }}
/>
```

By default, GridNexa uses the total real column width and does not paint a fake blank column after the last visible column. Pass `fillWidth` to let real columns fill the container. Columns with `flex` share the remaining width; `fillWidth={{ enabled: true, mode: "lastColumn" }}` makes the last visible data column absorb leftover space when you prefer that behavior.

## AI Command Support

```tsx
<GridNexa
  columns={columns}
  rows={rows}
  ai={{
    enabled: true,
    endpoint: "/api/gridnexa-ai",
    placeholder: "Ask AI to filter, sort, group, pivot, pin, hide, or export",
  }}
/>
```

AI support is provider-neutral. Keep OpenAI, Azure OpenAI, Anthropic, Gemini, local model, or gateway keys on your server. The browser sends grid state and receives a safe GridNexa action plan.

Supported AI actions include quick filter, column filter, advanced filter, sort, group, pivot, pin/hide column, and CSV/Excel export.

## Styling And Design Systems

```tsx
<GridNexa
  columns={columns}
  rows={rows}
  className="shadow-lg rounded-3"
  theme="dark"
  density="compact"
  classNames={{
    toolbar: "border bg-white",
    button: "btn btn-sm",
    input: "form-control form-control-sm",
    row: "custom-row",
    cell: "custom-cell",
  }}
  getRowClassName={({ row, selected }) =>
    selected ? "table-primary" : row.active ? "row-active" : "row-muted"
  }
  getCellClassName={({ column, value }) =>
    column.id === "score" && Number(value) >= 90 ? "text-success fw-bold" : undefined
  }
/>
```

Use Bootstrap, Tailwind, CSS Modules, SCSS, Less, or plain CSS through `className`, `classNames`, `getRowClassName`, `getCellClassName`, `getHeaderClassName`, `column.className`, `column.cellClassName`, and `column.headerClassName`.

## Feature Highlights

- Presets, saved views, loading/error/empty overlays, sorting, pagination, quick filter, column filters, external filters, and visual advanced filters
- Row selection, checkbox selection, row numbers, range selection, fill handle, find, undo, and redo
- Inline editors for text, number, date, checkbox, select, large text, and advanced select
- Formulas, clipboard operations, CSV export, and Excel export
- Column resize, aligned drag reorder, hide/show, pin/freeze, flex/fill-width columns, column menu, configurable side tools, and merged headers
- Row grouping, aggregation, pivoting, tree data, master/detail, and transactions
- Server-side operation callbacks for sorting, filtering, selection, pagination, grouping, pivoting, tree data, and transactions

## Related Packages

- `@gridnexa/angular`
- `@gridnexa/vue`
- `@gridnexa/javascript`
- `@gridnexa/core`

## License

MIT
