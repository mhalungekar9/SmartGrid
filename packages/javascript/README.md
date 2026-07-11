# GridNexa JavaScript Data Grid | TypeScript Table | Excel-Style Grid

Framework-free JavaScript and TypeScript data grid for dashboards, admin tools, reporting screens, and Excel-style workflows.

[![npm](https://img.shields.io/npm/v/@gridnexa/javascript?color=f7df1e)](https://www.npmjs.com/package/@gridnexa/javascript)
[![license](https://img.shields.io/npm/l/@gridnexa/javascript)](https://github.com/mhalungekar9/gridnexa)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

Use GridNexa without a framework when you want a typed data grid, data table, spreadsheet grid, or AG Grid alternative without committing to React, Angular, or Vue.

## Why Developers Choose GridNexa

- Framework-free setup with TypeScript column definitions.
- Sorting, filtering, editing, formulas, selection, range fill, undo/redo, grouping, pivoting, tree data, master/detail, export, and server-side operation callbacks.
- Shared contracts with `@gridnexa/react`, `@gridnexa/angular`, and `@gridnexa/vue`.
- CSS variables, stable class names, icons, themes, density, and layout options for product UIs.
- Useful search fit: JavaScript data grid, TypeScript table, data table, editable grid, Excel grid, spreadsheet grid, pivot table, tree grid, and enterprise grid.

## Feature Highlights

| Area | Included |
| --- | --- |
| Data operations | Editing, formulas, range fill, undo/redo, CSV/Excel export |
| Grid controls | Sorting, quick filter, column filters, advanced filters, pagination |
| Columns | Resize, reorder, hide/show, pin/freeze, menus, fill width |
| Analytics | Grouping, aggregation, pivoting, summaries, tree data |
| Integration | Server-side operation callbacks, transactions, AI action plans |
| Styling | Themes, CSS variables, stable classes, custom icons |

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/gridnexa

## Install

```bash
npm install @gridnexa/javascript
```

```bash
pnpm add @gridnexa/javascript
```

## Basic Usage

```ts
import { createGridNexa, type Column } from "@gridnexa/javascript";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  score: number;
  adjustedScore: string;
}

const columns: Column<Employee>[] = [
  { id: "name", field: "name", headerName: "Name", sortable: true, filter: "text", editable: true },
  { id: "department", field: "department", headerName: "Department", filter: "set" },
  { id: "score", field: "score", headerName: "Score", filter: "number", editable: true },
  { id: "adjustedScore", field: "adjustedScore", headerName: "Adjusted" },
];

const rows: Employee[] = [
  { id: 1, name: "John Carter", department: "Operations", city: "London", score: 92, adjustedScore: "=score * 1.05" },
  { id: 2, name: "Alice Moreau", department: "Product", city: "Paris", score: 87, adjustedScore: "=score * 1.05" },
];

const grid = createGridNexa<Employee>(document.getElementById("grid")!, {
  columns,
  rows,
  rowNumbers: true,
  checkboxSelection: true,
  enableFillHandle: true,
  enableUndoRedo: true,
  pageSize: 20,
  theme: "light",
  density: "standard",
  fillWidth: false,
  getRowId: (row) => row.id,
});

grid.update({ quickFilterText: "finance" });
```

## Toolbar, Header Tools, Footer, And Icons

```ts
createGridNexa(document.getElementById("grid")!, {
  columns: [
    {
      id: "name",
      field: "name",
      headerName: "Name",
      tools: { filter: false, filterPanel: false },
      icons: { menu: "..." },
    },
  ],
  rows,
  toolbar: {
    quickFilter: true,
    find: true,
    filters: true,
    advancedFilter: true,
    columns: true,
    addRow: true,
    deleteRow: true,
    deleteSelectedRows: true,
  },
  columnTools: {
    sort: true,
    filter: true,
    filterPanel: true,
    menu: true,
    resize: true,
    pin: true,
    hide: true,
    autosize: true,
  },
  footer: {
    rowCount: true,
    selectedRows: true,
    selectedCell: true,
    selectedRange: true,
    filterCount: true,
    sortStatus: true,
    pagination: true,
  },
  sidePanel: {
    columns: true,
    pivot: true,
    filters: true,
    defaultActivePanel: "columns",
  },
});
```

Set `toolbar`, `columnTools`, and `footer` to `false` to hide those surfaces. Use `column.tools` for per-column header control overrides and `footer.renderer` for custom footer content.

Set `sidePanel` to `false` or `{ enabled: false }` to hide the right-side tools. Use `{ columns, pivot, filters, defaultActivePanel }` to choose which side tabs appear and which tab opens first.

## Presets And Overlays

```ts
createGridNexa(document.getElementById("grid")!, {
  columns,
  rows,
  preset: "admin",
});

createGridNexa(document.getElementById("grid")!, {
  columns,
  rows,
  preset: "spreadsheet",
  stateStorage: {
    key: "employees-grid",
    type: "localStorage",
  },
});
```

Presets make common screens fast to ship:

- `basic` for clean read-only tables
- `admin` for CRUD-heavy internal tools
- `spreadsheet` for Excel-like data entry
- `analytics` for reporting and pivoting

Any explicit option still wins over the preset. `stateStorage` persists grid state such as column widths, hidden columns, pinned columns, filters, sorting, pagination, and side panel state.

```ts
createGridNexa(document.getElementById("grid")!, {
  columns,
  rows: [],
  loading: false,
  error: null,
  emptyState: "No employees found",
});
```

Built-in loading, error, and empty overlays render inside the grid viewport without changing header or body alignment.

## Feature Parity Note

React is the reference package and currently has the fullest productivity layer: saved views UI, command palette, change review, validation UI, diagnostics panel, Data Health panel, and Trust Mode panel.

The JavaScript package supports the shared core grid surface used in the playground: presets, overlays, sorting, filtering, editing, formulas, selection, range fill, undo/redo, column tools, grouping, pivoting, tree data, master/detail, export, AI actions, and server-side operation callbacks. React-only productivity panels such as Data Health and Trust Mode are planned for parity work before those docs are promoted for JavaScript.

## Column And Range Summaries

Copy this:

```ts
createGridNexa(document.getElementById("grid")!, {
  columns,
  rows,
  enableRangeSelection: true,
  summaries: {
    footer: true,
    selectedRange: true,
  },
});
```

When to use: show count, sum, average, min, and max for visible numeric data or a selected range.

Common mistakes: keep `enableRangeSelection` on for range summaries, keep the footer visible, and remember that text values are ignored.

## Column Width And Fill Behavior

```ts
createGridNexa(document.getElementById("grid")!, {
  columns: [
    { id: "name", field: "name", headerName: "Name", width: 180 },
    { id: "department", field: "department", headerName: "Department", flex: 1, minWidth: 180 },
    { id: "notes", field: "notes", headerName: "Notes", flex: 2, minWidth: 240 },
  ],
  rows,
  fillWidth: { enabled: true, mode: "flex" },
});
```

When `fillWidth` is not enabled, the grid stops at the total real column width so users do not see a misleading empty column after the last field. Enable `fillWidth` to distribute remaining space across `flex` columns, or use `mode: "lastColumn"` to let the final visible data column fill the container.

## AI Command Support

```ts
createGridNexa(document.getElementById("grid")!, {
  columns,
  rows,
  ai: {
    enabled: true,
    endpoint: "/api/gridnexa-ai",
    placeholder: "Ask AI to filter, sort, group, pivot, pin, hide, or export",
  },
});
```

The browser sends grid state to your endpoint. Your server can use OpenAI, Azure OpenAI, Anthropic, Gemini, Ollama, Bedrock, Groq, Mistral, or any internal model gateway and return a GridNexa action plan.

## Styling And Classes

Use `className`, `classNames`, `getRowClassName`, `getCellClassName`, `getHeaderClassName`, and column-level class hooks to plug into Bootstrap, Tailwind, CSS Modules, SCSS, Less, or plain CSS.

GridNexa injects runtime styles automatically. For the closest match to the playground and to keep bundlers aware of the stylesheet, import the package CSS once in your app entry:

```ts
import "@gridnexa/javascript/index.css";
```

Pass `unstyled: true` when your design system owns every grid rule.

## Complete Feature List

- Framework-free DOM mounting with typed options
- Sorting, pagination, quick filter, column filters, external filters, and advanced filters
- Selection, row numbers, copy/paste, find, fill, undo, and redo
- Inline editing, formulas, CSV export, and Excel export
- Merged headers, column resize, aligned drag reorder, hide/show, pinning, flex/fill-width columns, configurable side tools, and row reorder
- Grouping, pivoting, tree data, master/detail, transactions, and server-side operation callbacks
- AI command bar with safe action plans

## Related Packages

- `@gridnexa/react`
- `@gridnexa/angular`
- `@gridnexa/vue`
- `@gridnexa/core`

## License

MIT
