import { useGridContext } from "../../context/GridContext";
import type { Column } from "@smartgrid/core";
import { GridHeaderCell } from "../GridHeaderCell/GridHeaderCell";
import "./GridHeader.css";

import { buildColumnLayout } from "@smartgrid/core";

interface Props<T> {
  columns: Column<T>[];
}

export function GridHeader<T>({ columns }: Props<T>) {
  const { columnTemplate } = useGridContext<T>();
  const template = buildColumnLayout(columns);
  return (
    <div
      className="sg-header"
      style={{
        gridTemplateColumns: columnTemplate,
      }}
    >
      {columns.map((column) => (
        <GridHeaderCell key={column.id} column={column} />
      ))}
    </div>
  );
}
