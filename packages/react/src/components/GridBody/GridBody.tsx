import type { Column } from "@smartgrid/core";
import { GridRow } from "../GridRow/GridRow";
import "./GridBody.css";

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
}

export function GridBody<T>({ rows, columns }: Props<T>) {
  return (
    <div className="sg-body">
      {rows.map((row, index) => (
        <GridRow key={index} row={row} columns={columns} />
      ))}
    </div>
  );
}
