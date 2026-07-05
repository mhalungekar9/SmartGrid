# @gridnexa/angular

Enterprise Angular data grid for modern UI products that need spreadsheet-grade power without giving up product polish.

GridNexa is built for React, Angular, Vue, and JavaScript teams. The Angular package gives you a native Angular grid with typed columns, row selection, row numbers, sorting, filtering, advanced filters, formulas, inline editing, grouped headers, grouping, pivoting, tree data, master/detail, CSV export, Excel export, and theme-ready UI.

## Install

```bash
npm install @gridnexa/angular
```

```bash
pnpm add @gridnexa/angular
```

## Usage

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

## Features

- Native Angular data grid with TypeScript column models
- Excel-style features: formulas, fill, copy/paste, undo/redo, find, CSV export, and Excel export
- Filtering: column filters, quick filter, external filter, and advanced filter model
- Data modeling: grouping, pivoting, tree data indentation, master/detail, and transactions
- Grid UX: row selection, row numbers, pagination, status output, and tools panel
- Columns: merged headers, column visibility tools, column reorder, and row reorder
- Events: row selection, cell value changes, pivot model changes, advanced filter changes, and server-side operation events

## Links

- Website: https://www.gridnexa.in/
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid
