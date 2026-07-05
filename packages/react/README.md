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
      getRowId={(row) => row.id}
    />
  );
}
```

GridNexa ships with runtime styles, so the grid looks usable immediately. You can still import `@gridnexa/react/dist/index.css` for extracted CSS workflows or pass `unstyled` when your design system owns every rule.

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

- Sorting, pagination, quick filter, column filters, external filters, and visual advanced filters
- Row selection, checkbox selection, row numbers, range selection, fill handle, find, undo, and redo
- Inline editors for text, number, date, checkbox, select, large text, and advanced select
- Formulas, clipboard operations, CSV export, and Excel export
- Column resize, drag reorder, hide/show, pin/freeze, column menu, and merged headers
- Row grouping, aggregation, pivoting, tree data, master/detail, and transactions
- Server-side operation callbacks for sorting, filtering, selection, pagination, grouping, pivoting, tree data, and transactions

## Related Packages

- `@gridnexa/angular`
- `@gridnexa/vue`
- `@gridnexa/javascript`
- `@gridnexa/core`

## License

MIT
