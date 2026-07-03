import type { Column } from "../../models/Column";
import type { ColumnState } from "./ColumnState";

export class ColumnLayoutEngine<T> {
  build(columns: Column<T>[]): ColumnState<T>[] {
    let left = 0;

    return columns
      .filter((column) => !column.hidden)
      .map((column) => {
        const width = Math.max(
          column.minWidth ?? 60,
          Math.min(column.maxWidth ?? 1000, column.width ?? 150),
        );

        const state: ColumnState<T> = {
          column,

          actualWidth: width,

          left,

          visible: true,
        };

        left += width;

        return state;
      });
  }
}
