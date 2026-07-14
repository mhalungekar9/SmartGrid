import type { ComponentType } from "react";
import { Home } from "../pages/Home";
import { FeatureIndex } from "../pages/FeatureIndex";
import { DeveloperSetup } from "../pages/DeveloperSetup";
import { ProductivitySuite } from "../pages/ProductivitySuite";
import { BlogGridNexaReactDataGrid } from "../pages/BlogGridNexaReactDataGrid";
import { BasicGrid } from "../pages/BasicGrid";
import { Sorting } from "../pages/Sorting";
import { Filtering } from "../pages/Filtering";
import { Pagination } from "../pages/Pagination";
import { Selection } from "../pages/Selection";
import { RowReorder } from "../pages/RowReorder";
import { ColumnResize } from "../pages/ColumnResize";
import { ColumnReorder } from "../pages/ColumnReorder";
import { ColumnMerge } from "../pages/ColumnMerge";
import { FrozenColumns } from "../pages/FrozenColumns";
import { Templates } from "../pages/Templates";
import { Editing } from "../pages/Editing";
import { DataImportClipboard } from "../pages/DataImportClipboard";
import { Charts } from "../pages/Charts";
import { DashboardGenerator } from "../pages/DashboardGenerator";
import { AICommand } from "../pages/AICommand";
import { AIProviders } from "../pages/AIProviders";
import { Formulas } from "../pages/Formulas";
import { TreeGrid } from "../pages/TreeGrid";
import { Grouping } from "../pages/Grouping";
import { Aggregates } from "../pages/Aggregates";
import { VirtualScrolling } from "../pages/VirtualScrolling";
import { RemoteData } from "../pages/RemoteData";
import { DataHealth } from "../pages/DataHealth";
import { TrustMode } from "../pages/TrustMode";
import { Collaboration } from "../pages/Collaboration";
import { Export } from "../pages/Export";
import { Theme } from "../pages/Theme";
import { StylingConfiguration } from "../pages/StylingConfiguration";
import { GridConfiguration } from "../pages/GridConfiguration";
import { Events } from "../pages/Events";
import { Performance } from "../pages/Performance";
import { Diagnostics } from "../pages/Diagnostics";

export interface RouteItem {
  path: string;
  label: string;
  icon: string;
  component: ComponentType;
  description?: string;
  tags?: string[];
}

export const routeItems: Array<{ title: string; items: RouteItem[] }> = [
  {
    title: "Start Here",
    items: [
      {
        path: "/docs/feature-index",
        label: "Feature Index",
        icon: "bi-search",
        component: FeatureIndex,
        description: "Search and browse every playground feature, configuration, and demo.",
        tags: ["index", "search", "docs", "features"],
      },
      {
        path: "/docs/developer-setup",
        label: "Developer Setup",
        icon: "bi-box-arrow-in-down",
        component: DeveloperSetup,
        description: "Install, import CSS, Next.js setup, external app checklist, and recommended setup path.",
        tags: ["install", "css", "nextjs", "vite", "external app"],
      },
      {
        path: "/docs/productivity-suite",
        label: "Productivity Suite",
        icon: "bi-command",
        component: ProductivitySuite,
        description: "Saved views, command palette, change review, validation, diagnostics, Data Health, Trust Mode, and collaboration hooks in one workflow.",
        tags: ["saved views", "command palette", "validation", "diagnostics", "review", "data health", "trust mode", "collaboration"],
      },
      {
        path: "/blog/gridnexa-react-data-grid",
        label: "GridNexa Blog",
        icon: "bi-newspaper",
        component: BlogGridNexaReactDataGrid,
        description: "Publish-ready GridNexa React blog with feature screenshots, examples, and product positioning.",
        tags: ["blog", "marketing", "react data grid", "announcement", "seo", "gridnexa"],
      },
    ],
  },
  {
    title: "Core Grid",
    items: [
      { path: "/docs/basic-grid", label: "Basic Grid", icon: "bi-table", component: BasicGrid },
      { path: "/docs/sorting", label: "Sorting", icon: "bi-sort-alpha-down", component: Sorting },
      { path: "/docs/filtering", label: "Filtering", icon: "bi-funnel", component: Filtering },
      { path: "/docs/pagination", label: "Pagination", icon: "bi-layout-three-columns", component: Pagination },
      { path: "/docs/selection", label: "Selection", icon: "bi-check2-square", component: Selection },
      { path: "/docs/row-reorder", label: "Row Reorder", icon: "bi-arrow-down-up", component: RowReorder },
    ],
  },
  {
    title: "Columns",
    items: [
      { path: "/docs/column-resize", label: "Column Resize", icon: "bi-arrows-expand-vertical", component: ColumnResize },
      { path: "/docs/column-reorder", label: "Column Reorder", icon: "bi-arrow-left-right", component: ColumnReorder },
      { path: "/docs/column-merge", label: "Column Merge", icon: "bi-distribute-horizontal", component: ColumnMerge },
      { path: "/docs/frozen-columns", label: "Frozen Columns", icon: "bi-pin-angle", component: FrozenColumns },
      { path: "/docs/templates", label: "Templates", icon: "bi-braces", component: Templates },
    ],
  },
  {
    title: "Advanced",
    items: [
      { path: "/docs/editing", label: "Editing", icon: "bi-pencil-square", component: Editing },
      {
        path: "/docs/data-import-clipboard",
        label: "Import & Clipboard",
        icon: "bi-file-earmark-spreadsheet",
        component: DataImportClipboard,
        description: "Import Excel, CSV, TSV, text, and JSON; copy/paste spreadsheet ranges; bulk edit; and find/replace values.",
        tags: ["import", "excel", "xlsx", "csv", "json", "clipboard", "copy paste", "bulk edit", "find replace"],
      },
      {
        path: "/docs/charts",
        label: "Charts",
        icon: "bi-bar-chart",
        component: Charts,
        description: "Create bar, line, area, pie, donut, scatter, bubble, polar, statistical, box plot, hierarchical, funnel, and combo charts from grid data.",
        tags: ["charts", "insights", "bar chart", "line chart", "area chart", "pie chart", "donut", "scatter", "bubble", "radar", "polar", "histogram", "box plot", "treemap", "funnel", "combo chart", "analytics"],
      },
      {
        path: "/docs/dashboard-generator",
        label: "Dashboard Generator",
        icon: "bi-columns-gap",
        component: DashboardGenerator,
        description: "Generate KPI cards, chart suggestions, and insights from the current visible grid data.",
        tags: ["dashboard", "generator", "kpi", "charts", "analytics", "insights", "reporting"],
      },
      { path: "/docs/ai-command", label: "AI Command", icon: "bi-stars", component: AICommand },
      { path: "/docs/ai-providers", label: "AI Providers", icon: "bi-cpu", component: AIProviders },
      { path: "/docs/formulas", label: "Formulas", icon: "bi-calculator", component: Formulas },
      { path: "/docs/tree-grid", label: "Tree Grid", icon: "bi-diagram-3", component: TreeGrid },
      { path: "/docs/grouping", label: "Grouping", icon: "bi-collection", component: Grouping },
      { path: "/docs/aggregates", label: "Pivoting", icon: "bi-bar-chart", component: Aggregates },
      { path: "/docs/virtual-scrolling", label: "Virtual Scrolling", icon: "bi-window-stack", component: VirtualScrolling },
      { path: "/docs/remote-data", label: "Remote Data", icon: "bi-cloud-arrow-down", component: RemoteData },
      {
        path: "/docs/data-health",
        label: "Data Health",
        icon: "bi-clipboard2-pulse",
        component: DataHealth,
        description: "Profile missing values, duplicates, invalid cells, outliers, top values, and quality scores.",
        tags: ["data quality", "health", "duplicates", "missing", "invalid", "outliers", "profiling"],
      },
      {
        path: "/docs/trust-mode",
        label: "Trust Mode",
        icon: "bi-shield-check",
        component: TrustMode,
        description: "Inspect active-cell source, quality, downstream impact, edit history, and rollback.",
        tags: ["trust", "audit", "lineage", "quality", "rollback", "impact"],
      },
      {
        path: "/docs/collaboration",
        label: "Collaboration",
        icon: "bi-people",
        component: Collaboration,
        description: "Provider-based realtime cell patches, presence badges, cell locks, conflict modes, and keyboard-first accessibility.",
        tags: ["collaboration", "realtime", "presence", "cell lock", "accessibility", "keyboard", "aria", "multi user"],
      },
      { path: "/docs/export", label: "Export", icon: "bi-download", component: Export },
      {
        path: "/docs/diagnostics",
        label: "Diagnostics",
        icon: "bi-bug",
        component: Diagnostics,
        description: "Record grid actions and export compact repro snapshots for integration debugging.",
        tags: ["diagnostics", "repro", "debug", "recorder", "bug report"],
      },
      { path: "/docs/events", label: "Events", icon: "bi-broadcast", component: Events },
      { path: "/docs/performance", label: "Performance", icon: "bi-speedometer2", component: Performance },
    ],
  },
  {
    title: "Design",
    items: [
      {
        path: "/docs/theme",
        label: "Theme",
        icon: "bi-palette",
        component: Theme,
        description: "Compare built-in themes and learn styling tokens, density, column header styles, cell styles, text display, and responsive setup.",
        tags: ["theme", "themes", "styling", "tokens", "density", "responsive", "headers", "cells", "ellipsis", "wrap", "high contrast", "enterprise", "minimal"],
      },
      { path: "/docs/grid-configuration", label: "Grid Config", icon: "bi-sliders", component: GridConfiguration },
      { path: "/docs/styling-configuration", label: "Styling Config", icon: "bi-brush", component: StylingConfiguration },
    ],
  },
];

export const appRoutes: RouteItem[] = [
  { path: "/", label: "Home", icon: "bi-house", component: Home },
  ...routeItems.flatMap((group) => group.items),
];
