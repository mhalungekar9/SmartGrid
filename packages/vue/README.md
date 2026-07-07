# GridNexa Vue Data Grid | Vue Table

Enterprise Vue data grid with Excel-like workflows, safe AI command support, typed columns, and theme-ready styling.

[![npm](https://img.shields.io/npm/v/@gridnexa/vue?color=42b883)](https://www.npmjs.com/package/@gridnexa/vue)
[![license](https://img.shields.io/npm/l/@gridnexa/vue)](https://github.com/mhalungekar9/SmartGrid)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

GridNexa for Vue is a native Vue package for dashboards, admin products, reporting tools, and spreadsheet-style interfaces.

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid

## Install

```bash
npm install @gridnexa/vue
```

```bash
pnpm add @gridnexa/vue
```

## Basic Usage

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
    theme="light"
    density="standard"
    :page-size="20"
    :get-row-id="(row) => row.id"
    @row-selection-change="console.log"
    @cell-value-change="console.log"
  />
</template>
```

## Toolbar, Header Tools, Footer, And Icons

```vue
<template>
  <GridNexaVue
    :columns="columns"
    :rows="rows"
    :toolbar="{
      quickFilter: true,
      find: true,
      filters: true,
      advancedFilter: true,
      columns: true,
      addRow: true,
      deleteRow: true,
      deleteSelectedRows: true
    }"
    :column-tools="{
      sort: true,
      filter: true,
      filterPanel: true,
      menu: true,
      resize: true,
      pin: true,
      hide: true,
      autosize: true
    }"
    :footer="{
      rowCount: true,
      selectedRows: true,
      selectedCell: true,
      selectedRange: true,
      filterCount: true,
      sortStatus: true,
      pagination: true
    }"
  />
</template>
```

Use `columnTools` for global header-button defaults and `column.tools` for per-column overrides. Use `:footer="false"` to hide the footer, or pass `footer.renderer` for custom footer content. Custom icons can be supplied globally through `icons` and per column through `column.icons` where supported.

## AI Command Support

```vue
<template>
  <GridNexaVue
    :columns="columns"
    :rows="rows"
    :ai="{
      enabled: true,
      endpoint: '/api/gridnexa-ai',
      placeholder: 'Ask AI to filter, sort, group, pivot, pin, hide, or export'
    }"
  />
</template>
```

Keep AI provider keys on your backend. GridNexa receives only safe action-plan JSON and supports OpenAI, Azure OpenAI, Anthropic, Gemini, local models, or custom gateways.

## Styling And Classes

Use `className`, `classNames`, `getRowClassName`, `getCellClassName`, `getHeaderClassName`, and column class callbacks to connect Vue apps to Bootstrap, Tailwind, CSS Modules, SCSS, Less, or plain CSS.

## Feature Highlights

- Native Vue component with TypeScript column models
- Sorting, pagination, quick filter, column filters, external filters, and advanced filter model
- Selection, row numbers, copy/paste, fill, find, undo, and redo
- Inline editing, formulas, CSV export, and Excel export
- Merged headers, column resize, reorder, hide/show, pinning, and row reorder
- Grouping, pivoting, tree data, master/detail, transactions, and server-side operation events
- AI command bar with safe action plans

## Related Packages

- `@gridnexa/react`
- `@gridnexa/angular`
- `@gridnexa/javascript`
- `@gridnexa/core`

## License

MIT
