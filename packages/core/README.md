# GridNexa Core | Data Grid Contracts

Framework-neutral TypeScript contracts for GridNexa data grid packages.

[![npm](https://img.shields.io/npm/v/@gridnexa/core?color=2563eb)](https://www.npmjs.com/package/@gridnexa/core)
[![license](https://img.shields.io/npm/l/@gridnexa/core)](https://github.com/mhalungekar9/SmartGrid)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

`@gridnexa/core` contains the shared models used by the React, Angular, Vue, and JavaScript packages. Most applications should install a framework package directly; install core when you need shared types for library wrappers, backend contracts, or cross-framework tooling.

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/SmartGrid

## Install

```bash
npm install @gridnexa/core
```

Most apps should install one of these instead:

```bash
npm install @gridnexa/react
npm install @gridnexa/angular
npm install @gridnexa/vue
npm install @gridnexa/javascript
```

## Included Contracts

- `Column`
- `GridOptions`
- `ColumnFilterModel`
- `AdvancedFilterModel`
- `MergedHeader`
- `GridTransaction`
- `ServerSideOperationState`
- `GridNexaToolbarOptions`
- `GridNexaFooterOptions`
- `GridNexaSidePanelOptions`
- `GridNexaFillWidthOptions`
- `GridNexaColumnToolOptions`
- `GridNexaIconSet`
- `GridNexaApi`
- `PivotAggregation`
- `GridNexaAiRequest`
- `GridNexaCommandPlan`
- `GridNexaCommandAction`
- `GridNexaAiOptions`

## AI Action Plan Contract

```ts
import type { GridNexaAiRequest, GridNexaCommandPlan } from "@gridnexa/core";

export async function gridAiProvider(
  request: GridNexaAiRequest,
): Promise<GridNexaCommandPlan> {
  return {
    title: "Focus engineering performance",
    actions: [
      {
        type: "setColumnFilter",
        columnId: "department",
        filter: { type: "set", operator: "in", values: ["Engineering"] },
      },
      { type: "sort", columnId: "score", direction: "desc" },
    ],
  };
}
```

GridNexa AI actions are explicit and allow-listed. Providers return JSON plans; the grid decides how to apply them.

## Shared Configuration Contracts

Core includes the typed contracts used by all framework packages:

- `columnTools` controls header buttons globally, with per-column overrides through `column.tools`.
- `footer` controls row count, selected rows, selected cell, selected range, filter count, sort status, pagination, or a custom renderer.
- `sidePanel` controls the right-side Columns/Pivot and Filters tools, including disabled state and default active panel.
- `fillWidth` controls whether visible columns stop at their real total width or stretch to fill remaining container width with `flex` columns or the last visible data column.
- `icons` provides global icon replacement, while `column.icons` can override icons for a specific column.
- `toolbar` enables or hides quick filter, find, filters, advanced filter, columns, exports, add/delete rows, undo/redo, fill, and save-all tools.

React consumers should import `@gridnexa/react/index.css` once in the app entry. That exported CSS carries the shared header layout, drag/reorder indicators, pinned-column rules, popovers, scrollbars, and theme variables needed for installed apps to match the playground.

## Framework Packages

- `@gridnexa/react` for React UI applications
- `@gridnexa/angular` for Angular UI applications
- `@gridnexa/vue` for Vue UI applications
- `@gridnexa/javascript` for framework-free JavaScript and TypeScript applications

## License

MIT
