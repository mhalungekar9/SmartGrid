# GridNexa React Playground

A polished showcase for GridNexa React. Each page pairs a live grid with copyable usage code so developers can evaluate features quickly, test responsive behavior, and move examples into a real app without guesswork.

## Features

- Basic grid setup
- Presets for `basic`, `admin`, `spreadsheet`, and `analytics` workflows
- State persistence and saved views with `localStorage`
- Built-in loading, error, and empty overlays
- Data Health profiling for missing values, duplicates, invalid cells, outliers, and quality scores
- Trust Mode for active-cell source, quality evidence, impact preview, history, and rollback
- Dashboard Generator for KPI cards, inferred summaries, configured dashboard charts, and insight notes from visible rows
- Collaboration page with provider-based realtime patches, presence badges, cell locks, conflict modes, accessibility semantics, and keyboard navigation
- Sorting and filtering
- Pagination and selection
- Column resizing, pinning, aligned header drag/reorder, and templates
- Configurable right-side Columns/Pivot and Filters tools with mobile/tablet examples
- Editing, formulas, tree grid, grouping, pivoting, export, events, diagnostics, and performance examples
- Built-in `modern-light`, `modern-dark`, `compact`, `minimal`, `enterprise`, and `high-contrast` themes with shared styling tokens

## Dashboard Generator Example

```tsx
<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  preset="analytics"
  dashboard={{
    showPanel: true,
    maxCards: 4,
    maxRows: 500,
    charts: [
      { type: "bar", category: "region", value: "revenue", title: "Revenue by region" },
      { type: "line", category: "month", value: "revenue", title: "Revenue trend" },
      { type: "pie", category: "product", value: "deals", title: "Deals by product" }
    ]
  }}
  toolbar={{ dashboard: true, filters: true, quickFilter: true }}
/>
```

## Why It Matters

Grid demos often look good in isolation and then fall apart in installed apps because CSS is missing, popovers clip, state must be hand-wired, or every product screen needs a large custom toolbar. The playground is designed to prove the opposite: GridNexa should feel complete with small configuration, stay themeable, and keep complex interactions discoverable.

## External App Parity

The playground imports the package stylesheet explicitly:

```ts
import "@gridnexa/react/index.css";
```

Use the same import once in external React apps so header layout, drag handles, column reorder drop indicators, pinned columns, popovers, scrollbars, and default themes match the playground.
