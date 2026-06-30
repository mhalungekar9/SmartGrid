import type { Column } from "../../models/Column";

export interface ColumnState<T> {
  column: Column<T>;

  actualWidth: number;

  left: number;

  visible: boolean;
}
