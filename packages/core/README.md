# GridNexa Core | Data Grid Contracts | Data Table Types

Framework-neutral TypeScript contracts for GridNexa data grid, data table, Excel grid, and framework wrapper packages.

[![npm](https://img.shields.io/npm/v/@gridnexa/core?color=2563eb)](https://www.npmjs.com/package/@gridnexa/core)
[![license](https://img.shields.io/npm/l/@gridnexa/core)](https://github.com/mhalungekar9/gridnexa)
[![types](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![website](https://img.shields.io/badge/website-gridnexa.in-2563eb)](https://www.gridnexa.in/)

`@gridnexa/core` contains the shared models used by the React, Angular, Vue, and JavaScript packages. Most applications should install a framework package directly; install core when you need shared types for library wrappers, backend contracts, data-quality and trust tooling, server-side grid operations, AI action plans, or cross-framework tooling.

## Why This Package Exists

GridNexa is designed as a shared data-grid system, not a one-off component. The core package keeps column definitions, filter models, toolbar options, state persistence, diagnostics, AI command plans, and row-change contracts consistent across frameworks.

Use it when you want:

- Typed `Column` and `GridOptions` contracts shared between frontend packages.
- Server-side operation models for filtering, sorting, pagination, grouping, pivoting, tree data, and transactions.
- Toolbar contracts for import data, copy/paste, bulk edit, find/replace, filters, exports, and row actions.
- Chart contracts for selected-range or visible-row insight charts.
- Diagnostics, Data Health, Trust Mode, Dashboard Generator, and repro snapshot contracts for developer support, data-quality, reporting, and active-cell trust flows.
- Realtime collaboration contracts for provider-based cell changes, cell locks, presence, and conflict modes.
- A stable base for React, Angular, Vue, and framework-free JavaScript wrappers.

## Quick Links

- Website: https://www.gridnexa.in/
- Docs and playground: https://www.gridnexa.in/docs/basic-grid
- Help: https://www.gridnexa.in/help
- Repository: https://github.com/mhalungekar9/gridnexa

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
- `GridNexaPreset`
- `GridNexaTheme`
- `GridNexaThemeTokens`
- `GridNexaStylingOptions`
- `GridNexaStyleObject`
- `GridNexaStateStorageOptions`
- `GridNexaColumnToolOptions`
- `GridNexaIconSet`
- `GridNexaApi`
- `PivotAggregation`
- `GridNexaAiRequest`
- `GridNexaCommandPlan`
- `GridNexaCommandAction`
- `GridNexaAiOptions`
- `GridNexaReproSnapshot`
- `GridNexaDataHealthOptions`
- `GridNexaTrustModeOptions`
- `GridNexaDashboardChart`
- `GridNexaDashboardOptions`
- `GridNexaCollaborationOptions`
- `GridNexaCollaborationProvider`
- `GridNexaCollaborationCellEvent`
- `GridNexaChartsOptions`
- `GridNexaChartType`

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
- `preset` provides typed shortcuts for common grid modes such as `basic`, `admin`, `spreadsheet`, and `analytics`.
- `theme`, `density`, and `styling` provide design-system configuration for built-in themes, token overrides, slot-level styles, row/header/cell dimensions, selected states, focus states, and responsive spacing.
- `stateStorage` describes saved-view persistence for column, filter, sort, pagination, and side-panel state.
- `summaries` controls footer and selected-range numeric summaries.
- `views` describes named saved views and localStorage keys.
- `commandPalette` enables a command launcher contract for discoverable grid actions.
- `changeReview` describes pre-save review of edits, row additions, and deletions.
- `validation` describes fast cell validation rules and save blocking.
- `diagnostics` describes developer-facing runtime diagnostics, action recording, and one-click repro snapshot export/import.
- `dataHealth` describes opt-in column profiling for missing values, duplicates, invalid cells, numeric outliers, quality scores, and issue-focused filtering.
- `trustMode` describes opt-in active-cell trust inspection for source, validation, data-quality evidence, impact preview, tracked edits, and rollback.
- `dashboard` describes opt-in dashboard generation for KPI cards, inferred summaries, configured dashboard charts, and insight notes from visible grid data. `dashboard.charts` accepts chart definitions with `type`, `category`, `value`, and optional `title` so apps can pin exact bar, line, area, pie, or donut charts into the generated dashboard.
- `collaboration` describes provider-based realtime editing with user presence, cell-change events, cell locks, and conflict modes: `cell-lock`, `last-write-wins`, or `versioned`.
- `charts` describes built-in insight chart behavior for bar, line, area, pie, donut, scatter, bubble, radar, radial, histogram, box plot, treemap, gauge, funnel, and combo charts.
- `icons` provides global icon replacement, while `column.icons` can override icons for a specific column. Column definitions can also provide `headerStyle`, `cellStyle`, and `textDisplay` overrides for header typography, alignment, icon sizing, cell color, wrap, clip, ellipsis, and tooltip behavior.
- `toolbar` enables or hides quick filter, find, find/replace, filters, advanced filter, columns, import data, copy/paste, bulk edit, charts, exports, add/delete rows, undo/redo, fill, and save-all tools.

React consumers should import `@gridnexa/react/index.css` once in the app entry. That exported CSS carries the shared header layout, drag/reorder indicators, pinned-column rules, popovers, scrollbars, and theme variables needed for installed apps to match the playground.

## Framework Packages

- `@gridnexa/react` for React UI applications
- `@gridnexa/angular` for Angular UI applications
- `@gridnexa/vue` for Vue UI applications
- `@gridnexa/javascript` for framework-free JavaScript and TypeScript applications

## License

MIT
