# @gridnexa/javascript

Framework-free JavaScript and TypeScript data grid for modern UI products, dashboards, admin tools, reporting screens, and spreadsheet-like workflows.

GridNexa is built for React, Angular, Vue, and JavaScript teams. The JavaScript package can be installed directly from npm and mounted into any plain DOM app. It includes typed columns, row selection, row numbers, sorting, filtering, advanced filters, formulas, inline editing, grouped headers, grouping, pivoting, tree data, master/detail, CSV export, Excel export, and theme-ready rendering.

## Install

```bash
npm install @gridnexa/javascript
```

```bash
pnpm add @gridnexa/javascript
```

## Usage

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
  getRowId: (row) => row.id,
});

grid.update({ quickFilterText: "finance" });
```

## Features

- Framework-free data grid for JavaScript and TypeScript
- Excel-style features: formulas, fill, copy/paste, undo/redo, find, CSV export, and Excel export
- Filtering: column filters, quick filter, external filter, and advanced filter model
- Data modeling: grouping, pivoting, tree data indentation, master/detail, and transactions
- Grid UX: row selection, row numbers, pagination, status bar, and tools panel
- Columns: merged headers, column visibility tools, drag-and-drop column reorder, and row reorder
- Callbacks: row selection, cell value changes, pivot model changes, advanced filter changes, and server-side operations

## Links

- Website: https://www.gridnexa.in/
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid
