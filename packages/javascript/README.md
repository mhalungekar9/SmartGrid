# GridNexa JavaScript Data Grid | TypeScript Table

Framework-free JavaScript and TypeScript data grid with Excel-like features, safe AI command support, and built-in styling.

[![npm](https://img.shields.io/npm/v/@gridnexa/javascript?color=f7df1e)](https://www.npmjs.com/package/@gridnexa/javascript)
[![license](https://img.shields.io/npm/l/@gridnexa/javascript)](https://github.com/mhalungekar9/SmartGrid)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

Use GridNexa without a framework in dashboards, admin tools, reporting screens, embedded widgets, and spreadsheet-style workflows.

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid

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

When testing the React package in an external app, import `@gridnexa/react/index.css` once in the app entry. The CSS export contains the shared header layout, drag handles, drop indicators, pinned-column rules, popovers, scrollbars, and theme variables that make installed-package behavior match the playground.

## Feature Highlights

- Framework-free DOM mounting with typed options
- Sorting, pagination, quick filter, column filters, external filters, and advanced filters
- Selection, row numbers, copy/paste, find, fill, undo, and redo
- Inline editing, formulas, CSV export, and Excel export
- Merged headers, column resize, aligned drag reorder, hide/show, pinning, configurable side tools, and row reorder
- Grouping, pivoting, tree data, master/detail, transactions, and server-side operation callbacks
- AI command bar with safe action plans

## Related Packages

- `@gridnexa/react`
- `@gridnexa/angular`
- `@gridnexa/vue`
- `@gridnexa/core`

## License

MIT
