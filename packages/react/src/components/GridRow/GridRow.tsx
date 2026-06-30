import { useGridContext } from "../../context/GridContext";
import type { Column } from "@smartgrid/core";
import { GridCell } from "../GridCell/GridCell";

import "./GridRow.css";

import { ColumnLayoutEngine } from "@smartgrid/core";

interface Props<T> {
  row: T;
  columns: Column<T>[];
}

export function GridRow<T>({ row, columns }: Props<T>) {
  const { columnTemplate } = useGridContext<T>();
  const layoutEngine = new ColumnLayoutEngine<T>();

  const columnStates = layoutEngine.build(columns);

  return (
    <div
      className="sg-row"
      style={{
        gridTemplateColumns: columnTemplate,
      }}
    >
      {columns.map((column) => (
        <GridCell key={column.id} row={row} column={column} />
      ))}
    </div>
  );
}
