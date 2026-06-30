import type { Column } from "@smartgrid/core";
import "./GridCell.css";

interface Props<T> {
  row: T;
  column: Column<T>;
}

export function GridCell<T>({ row, column }: Props<T>) {
  const value = row[column.field];

  return <div className="sg-cell">{String(value ?? "")}</div>;
}
