import { Column } from "./Column";

export interface GridState<T = unknown> {
  columns: Column<T>[];
  rows: T[];
}
