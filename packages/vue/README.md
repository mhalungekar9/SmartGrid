# @gridnexa/vue

Enterprise Vue data grid for modern UI products that need spreadsheet-grade power without giving up product polish.

GridNexa is built for React, Angular, Vue, and JavaScript teams. The Vue package gives you a native Vue grid with typed columns, row selection, row numbers, sorting, filtering, advanced filters, formulas, inline editing, grouped headers, grouping, pivoting, tree data, master/detail, CSV export, Excel export, and theme-ready UI.

## Install

```bash
npm install @gridnexa/vue
```

```bash
pnpm add @gridnexa/vue
```

## Usage

```vue
<script setup lang="ts">
import { GridNexaVue, type Column } from "@gridnexa/vue";

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
</script>

<template>
  <GridNexaVue
    :columns="columns"
    :rows="rows"
    row-numbers
    checkbox-selection
    enable-fill-handle
    enable-undo-redo
    :page-size="20"
    :get-row-id="(row) => row.id"
    @row-selection-change="console.log"
    @cell-value-change="console.log"
  />
</template>
```

## Features

- Native Vue data grid with TypeScript column models
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
