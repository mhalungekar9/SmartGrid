import type { Column } from "@smartgrid/core";
import "./GridHeaderCell.css";

interface Props<T> {
  column: Column<T>;
}

export function GridHeaderCell<T>({ column }: Props<T>) {
  return <div className="sg-header-cell">{column.headerName}</div>;
}
