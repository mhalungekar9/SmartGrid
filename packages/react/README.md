# @gridnexa/react

Enterprise React data grid for modern UI products that need spreadsheet-grade power without giving up product polish.

GridNexa is built for React, Angular, Vue, and JavaScript teams. The React package gives you a native React grid with typed columns, row selection, row numbers, sorting, filtering, advanced filters, formulas, inline editing, undo/redo, range selection, fill handle, grouped headers, grouping, pivoting, tree data, master/detail, CSV export, Excel export, column tools, and theme-ready styling.

## Install

```bash
npm install @gridnexa/react
```

```bash
pnpm add @gridnexa/react
```

## Usage

```tsx
import { GridNexa, type Column } from "@gridnexa/react";
import "@gridnexa/react/dist/index.css";

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
      getRowId={(row) => row.id}
    />
  );
}
```

## Features

- Native React data grid with TypeScript-first column definitions
- Excel-style features: formulas, fill handle, copy/paste, undo/redo, find, CSV export, and Excel export
- Filtering: text, number, date, set, multi, quick, external, and visual advanced filters
- Data modeling: row grouping, aggregation, pivoting, tree data, master/detail, and transactions
- Grid UX: row selection, row numbers, range selection, status bar, column menu, context menu, and tool panels
- Columns: resize, reorder, hide/show, pin/freeze, merged headers, and grouped headers
- Editing: text, number, date, checkbox, select, large text, and advanced select editors
- Styling: light/dark themes and CSS customization for enterprise UI systems
- Server-side operation callbacks for sorting, filtering, selection, pagination, grouping, pivoting, tree data, and transactions

## Links

- Website: https://www.gridnexa.in/
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid
