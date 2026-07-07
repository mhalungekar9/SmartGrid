import type { ComponentType } from "react";
import { Home } from "../pages/Home";
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
import { AICommand } from "../pages/AICommand";
import { AIProviders } from "../pages/AIProviders";
import { Formulas } from "../pages/Formulas";
import { TreeGrid } from "../pages/TreeGrid";
import { Grouping } from "../pages/Grouping";
import { Aggregates } from "../pages/Aggregates";
import { VirtualScrolling } from "../pages/VirtualScrolling";
import { RemoteData } from "../pages/RemoteData";
import { Export } from "../pages/Export";
import { Theme } from "../pages/Theme";
import { StylingConfiguration } from "../pages/StylingConfiguration";
import { GridConfiguration } from "../pages/GridConfiguration";
import { Events } from "../pages/Events";
import { Performance } from "../pages/Performance";

export interface RouteItem {
  path: string;
  label: string;
  icon: string;
  component: ComponentType;
}

export const routeItems: Array<{ title: string; items: RouteItem[] }> = [
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
      { path: "/docs/ai-command", label: "AI Command", icon: "bi-stars", component: AICommand },
      { path: "/docs/ai-providers", label: "AI Providers", icon: "bi-cpu", component: AIProviders },
      { path: "/docs/formulas", label: "Formulas", icon: "bi-calculator", component: Formulas },
      { path: "/docs/tree-grid", label: "Tree Grid", icon: "bi-diagram-3", component: TreeGrid },
      { path: "/docs/grouping", label: "Grouping", icon: "bi-collection", component: Grouping },
      { path: "/docs/aggregates", label: "Pivoting", icon: "bi-bar-chart", component: Aggregates },
      { path: "/docs/virtual-scrolling", label: "Virtual Scrolling", icon: "bi-window-stack", component: VirtualScrolling },
      { path: "/docs/remote-data", label: "Remote Data", icon: "bi-cloud-arrow-down", component: RemoteData },
      { path: "/docs/export", label: "Export", icon: "bi-download", component: Export },
      { path: "/docs/events", label: "Events", icon: "bi-broadcast", component: Events },
      { path: "/docs/performance", label: "Performance", icon: "bi-speedometer2", component: Performance },
    ],
  },
  {
    title: "Design",
    items: [
      { path: "/docs/theme", label: "Theme", icon: "bi-palette", component: Theme },
      { path: "/docs/grid-configuration", label: "Grid Config", icon: "bi-sliders", component: GridConfiguration },
      { path: "/docs/styling-configuration", label: "Styling Config", icon: "bi-brush", component: StylingConfiguration },
    ],
  },
];

export const appRoutes: RouteItem[] = [
  { path: "/", label: "Home", icon: "bi-house", component: Home },
  ...routeItems.flatMap((group) => group.items),
];
