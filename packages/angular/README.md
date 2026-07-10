# GridNexa Angular Data Grid | Angular Table | Excel-Style Grid

Angular data grid and Angular table for product teams that need Excel-like editing, filtering, formulas, grouping, pivoting, export, typed columns, and design-system friendly styling.

[![npm](https://img.shields.io/npm/v/@gridnexa/angular?color=dd0031)](https://www.npmjs.com/package/@gridnexa/angular)
[![license](https://img.shields.io/npm/l/@gridnexa/angular)](https://github.com/mhalungekar9/SmartGrid)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

GridNexa for Angular is a native Angular package for product teams building admin tools, dashboards, reporting screens, and spreadsheet-style workflows. Use it when you are comparing Angular data grid, Angular table, Angular data table, AG Grid alternative, Excel grid, spreadsheet grid, editable grid, pivot table, or tree grid options.

## Why Developers Choose GridNexa

- Native Angular standalone component with TypeScript column models.
- Sorting, filtering, editing, formulas, selection, range fill, undo/redo, grouping, pivoting, tree data, master/detail, export, and server-side operation events.
- Shared GridNexa contracts across React, Angular, Vue, and JavaScript.
- CSS variables, stable class names, themes, density, custom icons, and fill-width behavior for product UIs.
- Practical defaults through presets for `basic`, `admin`, `spreadsheet`, and `analytics` use cases.

## Feature Highlights

| Area | Included |
| --- | --- |
| Spreadsheet workflows | Editing, formulas, range fill, undo/redo, CSV/Excel export |
| Search and filters | Quick filter, column filters, advanced filters, set filters |
| Columns | Resize, reorder, hide/show, pin/freeze, menus, fill width |
| Analytics | Grouping, aggregation, pivoting, summaries, tree data |
| Integration | Server-side operation events, transactions, AI action plans |
| Styling | Themes, CSS variables, stable classes, custom icons |

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
      [fillWidth]="false"
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
  [sidePanel]="{
    columns: true,
    pivot: true,
    filters: true,
    defaultActivePanel: 'columns'
  }"
/>
```

Use `columnTools` for global header-button defaults and `column.tools` for per-column overrides. Use `[footer]="false"` to hide the footer, or pass `footer.renderer` for a custom footer. Custom icons can be supplied through `icons` and per-column `icons` values where supported.

Use `[sidePanel]="false"` or `[sidePanel]="{ enabled: false }"` to hide right-side tools. Use `columns`, `pivot`, `filters`, and `defaultActivePanel` to control which side tabs appear and which one opens first.

## Presets And Overlays

```html
<grid-nexa
  [columns]="columns"
  [rows]="rows"
  preset="admin"
/>

<grid-nexa
  [columns]="columns"
  [rows]="rows"
  preset="spreadsheet"
  [stateStorage]="{
    key: 'employees-grid',
    type: 'localStorage'
  }"
/>
```

Presets reduce setup for common product surfaces:

- `basic` for clean read-only tables
- `admin` for CRUD-heavy internal tools
- `spreadsheet` for Excel-like editing and fill workflows
- `analytics` for reporting and pivoting

Explicit inputs still win over preset defaults. `stateStorage` persists grid state such as column widths, hidden columns, pinned columns, filters, sorting, and pagination.

```html
<grid-nexa
  [columns]="columns"
  [rows]="[]"
  [loading]="isLoading"
  [error]="error"
  emptyState="No employees found"
/>
```

Built-in loading, error, and empty overlays appear inside the grid viewport without breaking header/body alignment.

## Feature Parity Note

React is the reference package and currently has the fullest productivity layer: saved views UI, command palette, change review, validation UI, and diagnostics panel.

The Angular package supports the shared core grid surface used in the playground: presets, overlays, sorting, filtering, editing, formulas, selection, range fill, undo/redo, column tools, grouping, pivoting, tree data, master/detail, export, AI actions, and server-side operation events. The React-only productivity layer is planned for parity work before those docs are promoted for Angular.

## Column And Range Summaries

Copy this:

```html
<grid-nexa
  [columns]="columns"
  [rows]="rows"
  [enableRangeSelection]="true"
  [summaries]="{
    footer: true,
    selectedRange: true
  }"
/>
```

When to use: show count, sum, average, min, and max for visible numeric data or a selected range.

Common mistakes: keep `enableRangeSelection` on for range summaries, keep the footer visible, and remember that text values are ignored.

## Column Width And Fill Behavior

```html
<grid-nexa
  [columns]="[
    { id: 'name', field: 'name', headerName: 'Name', width: 180 },
    { id: 'department', field: 'department', headerName: 'Department', flex: 1, minWidth: 180 },
    { id: 'notes', field: 'notes', headerName: 'Notes', flex: 2, minWidth: 240 }
  ]"
  [rows]="rows"
  [fillWidth]="{ enabled: true, mode: 'flex' }"
/>
```

When `fillWidth` is disabled, the grid stops at the total real column width instead of showing a blank fake column. Enable it to stretch real columns with `flex`, or use `mode: 'lastColumn'` to let the final visible data column fill remaining space.

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

GridNexa injects baseline runtime styles automatically. For the closest match to the playground and to keep bundlers aware of the stylesheet, import the package CSS once in your app entry:

```ts
import "@gridnexa/angular/index.css";
```

Pass `unstyled` when your design system owns every grid rule.

## Complete Feature List

- Sorting, pagination, quick filter, column filters, external filters, and advanced filter model
- Selection, row numbers, clipboard operations, fill, find, undo, and redo
- Inline editing, formulas, CSV export, and Excel export
- Merged headers, column resize, aligned drag reorder, hide/show, pinning, flex/fill-width columns, configurable side tools, and row reorder
- Grouping, pivoting, tree data, master/detail, transactions, and server-side operation events
- AI command bar with safe action plans

## Related Packages

- `@gridnexa/react`
- `@gridnexa/vue`
- `@gridnexa/javascript`
- `@gridnexa/core`

## License

MIT
