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
import { Formulas } from "../pages/Formulas";
import { TreeGrid } from "../pages/TreeGrid";
import { Grouping } from "../pages/Grouping";
import { Aggregates } from "../pages/Aggregates";
import { VirtualScrolling } from "../pages/VirtualScrolling";
import { RemoteData } from "../pages/RemoteData";
import { Export } from "../pages/Export";
import { Theme } from "../pages/Theme";
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
    title: "Start",
    items: [{ path: "/", label: "Home", icon: "bi-house", component: Home }],
  },
  {
    title: "Core Grid",
    items: [
      { path: "/basic-grid", label: "Basic Grid", icon: "bi-table", component: BasicGrid },
      { path: "/sorting", label: "Sorting", icon: "bi-sort-alpha-down", component: Sorting },
      { path: "/filtering", label: "Filtering", icon: "bi-funnel", component: Filtering },
      { path: "/pagination", label: "Pagination", icon: "bi-layout-three-columns", component: Pagination },
      { path: "/selection", label: "Selection", icon: "bi-check2-square", component: Selection },
      { path: "/row-reorder", label: "Row Reorder", icon: "bi-arrow-down-up", component: RowReorder },
    ],
  },
  {
    title: "Columns",
    items: [
      { path: "/column-resize", label: "Column Resize", icon: "bi-arrows-expand-vertical", component: ColumnResize },
      { path: "/column-reorder", label: "Column Reorder", icon: "bi-arrow-left-right", component: ColumnReorder },
      { path: "/column-merge", label: "Column Merge", icon: "bi-distribute-horizontal", component: ColumnMerge },
      { path: "/frozen-columns", label: "Frozen Columns", icon: "bi-pin-angle", component: FrozenColumns },
      { path: "/templates", label: "Templates", icon: "bi-braces", component: Templates },
    ],
  },
  {
    title: "Advanced",
    items: [
      { path: "/editing", label: "Editing", icon: "bi-pencil-square", component: Editing },
      { path: "/formulas", label: "Formulas", icon: "bi-calculator", component: Formulas },
      { path: "/tree-grid", label: "Tree Grid", icon: "bi-diagram-3", component: TreeGrid },
      { path: "/grouping", label: "Grouping", icon: "bi-collection", component: Grouping },
      { path: "/aggregates", label: "Pivoting", icon: "bi-bar-chart", component: Aggregates },
      { path: "/virtual-scrolling", label: "Virtual Scrolling", icon: "bi-window-stack", component: VirtualScrolling },
      { path: "/remote-data", label: "Remote Data", icon: "bi-cloud-arrow-down", component: RemoteData },
      { path: "/export", label: "Export", icon: "bi-download", component: Export },
      { path: "/events", label: "Events", icon: "bi-broadcast", component: Events },
      { path: "/performance", label: "Performance", icon: "bi-speedometer2", component: Performance },
    ],
  },
  {
    title: "Design",
    items: [{ path: "/theme", label: "Theme", icon: "bi-palette", component: Theme }],
  },
];
