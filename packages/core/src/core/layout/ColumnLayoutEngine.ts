import type { Column } from "../../models/Column";
import type { ColumnState } from "./ColumnState";

export class ColumnLayoutEngine<T> {
  build(columns: Column<T>[]): ColumnState<T>[] {
    let left = 0;

    return columns.map((column) => {
      const width = column.width ?? 150;

      const state: ColumnState<T> = {
        column,

        actualWidth: width,

        left,

        visible: !column.hidden,
      };

      left += width;

      return state;
    });
  }
}
