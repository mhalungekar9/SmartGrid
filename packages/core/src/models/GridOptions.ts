import { Column } from "./Column";

export interface GridOptions<T = unknown> {
  columns: Column<T>[];
  rows: T[];
}
