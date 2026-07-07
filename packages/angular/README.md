# GridNexa Angular Data Grid | Angular Table

Enterprise Angular data grid with Excel-like interactions, safe AI command support, typed column models, and design-system friendly styling.

[![npm](https://img.shields.io/npm/v/@gridnexa/angular?color=dd0031)](https://www.npmjs.com/package/@gridnexa/angular)
[![license](https://img.shields.io/npm/l/@gridnexa/angular)](https://github.com/mhalungekar9/SmartGrid)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

GridNexa for Angular is a native Angular package for product teams building admin tools, dashboards, reporting screens, and spreadsheet-style workflows.

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid

## Install

```bash
npm install @gridnexa/angular
```

```bash
pnpm add @gridnexa/angular
```

## Basic Usage

```ts
import { Component } from "@angular/core";
import { GridNexaAngularComponent, type Column } from "@gridnexa/angular";

interface Employee {
  id: number;
  name: string;
  department: string;
  city: string;
  score: number;
  adjustedScore: string;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [GridNexaAngularComponent],
  template: `
    <grid-nexa
      [columns]="columns"
      [rows]="rows"
      [rowNumbers]="true"
      [checkboxSelection]="true"
      [enableFillHandle]="true"
      [enableUndoRedo]="true"
      [pageSize]="20"
      theme="light"
      density="standard"
      [getRowId]="getRowId"
      (rowSelectionChange)="onSelection($event)"
      (cellValueChange)="onCellValueChange($event)"
    />
  `,
})
export class AppComponent {
  columns: Column<Employee>[] = [
    { id: "name", field: "name", headerName: "Name", sortable: true, filter: "text", editable: true },
    { id: "department", field: "department", headerName: "Department", filter: "set" },
    { id: "score", field: "score", headerName: "Score", filter: "number", editable: true },
    { id: "adjustedScore", field: "adjustedScore", headerName: "Adjusted" },
  ];

  rows: Employee[] = [
    { id: 1, name: "John Carter", department: "Operations", city: "London", score: 92, adjustedScore: "=score * 1.05" },
    { id: 2, name: "Alice Moreau", department: "Product", city: "Paris", score: 87, adjustedScore: "=score * 1.05" },
  ];

  getRowId = (row: Employee) => row.id;

  onSelection(rows: Employee[]) {
    console.log(rows);
  }

  onCellValueChange(event: unknown) {
    console.log(event);
  }
}
```

## Toolbar, Header Tools, Footer, And Icons

```html
<grid-nexa
  [columns]="columns"
  [rows]="rows"
  [toolbar]="{
    quickFilter: true,
    find: true,
    filters: true,
    advancedFilter: true,
    columns: true,
    addRow: true,
    deleteRow: true,
    deleteSelectedRows: true
  }"
  [columnTools]="{
    sort: true,
    filter: true,
    filterPanel: true,
    menu: true,
    resize: true,
    pin: true,
    hide: true,
    autosize: true
  }"
  [footer]="{
    rowCount: true,
    selectedRows: true,
    selectedCell: true,
    selectedRange: true,
    filterCount: true,
    sortStatus: true,
    pagination: true
  }"
/>
```

Use `columnTools` for global header-button defaults and `column.tools` for per-column overrides. Use `[footer]="false"` to hide the footer, or pass `footer.renderer` for a custom footer. Custom icons can be supplied through `icons` and per-column `icons` values where supported.

## AI Command Support

```html
<grid-nexa
  [columns]="columns"
  [rows]="rows"
  [ai]="{
    enabled: true,
    endpoint: '/api/gridnexa-ai',
    placeholder: 'Ask AI to filter, sort, group, pivot, pin, hide, or export'
  }"
/>
```

Keep provider keys on your backend. GridNexa accepts safe action plans from OpenAI, Azure OpenAI, Anthropic, Gemini, local models, or an internal gateway.

## Styling And Classes

Use `className`, `classNames`, `getRowClassName`, `getCellClassName`, `getHeaderClassName`, and column-level `className`, `cellClassName`, and `headerClassName` to connect Bootstrap, utility classes, CSS Modules, SCSS, Less, or plain CSS.

If you compare behavior with an installed React app, import `@gridnexa/react/index.css` once in that app entry. The CSS export includes the shared header layout, drag handles, drop indicators, pinned-column rules, popovers, scrollbars, and theme variables used by the playground.

## Feature Highlights

- Sorting, pagination, quick filter, column filters, external filters, and advanced filter model
- Selection, row numbers, clipboard operations, fill, find, undo, and redo
- Inline editing, formulas, CSV export, and Excel export
- Merged headers, column resize, aligned drag reorder, hide/show, pinning, and row reorder
- Grouping, pivoting, tree data, master/detail, transactions, and server-side operation events
- AI command bar with safe action plans

## Related Packages

- `@gridnexa/react`
- `@gridnexa/vue`
- `@gridnexa/javascript`
- `@gridnexa/core`

## License

MIT
