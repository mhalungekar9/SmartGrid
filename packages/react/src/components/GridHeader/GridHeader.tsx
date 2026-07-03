import type { Column } from "@smartgrid/core";
import { useGridContext } from "../../context/GridContext";
import { GridHeaderCell } from "../GridHeaderCell/GridHeaderCell";
import "./GridHeader.css";

interface Props<T> {
  columns: Column<T>[];
  widths: number[];
  sortModel: { columnId: string; direction: "asc" | "desc" } | null;
  onSort: (columnId: string) => void;
  onResizeStart: (columnId: string, startWidth: number, startX: number) => void;
  onAutoSize: (columnId: string) => void;
}

export function GridHeader<T>({
  columns,
  widths,
  sortModel,
  onSort,
  onResizeStart,
  onAutoSize,
}: Props<T>) {
  const { columnTemplate } = useGridContext<T>();

  return (
    <div className="sg-header" style={{ gridTemplateColumns: columnTemplate }}>
      {columns
        .filter((column) => !column.hidden)
        .map((column, index) => (
          <GridHeaderCell
            key={column.id}
            column={column}
            width={widths[index]}
            sortDirection={
              sortModel?.columnId === column.id ? sortModel.direction : null
            }
            onSort={onSort}
            onResizeStart={onResizeStart}
            onAutoSize={onAutoSize}
          />
        ))}
    </div>
  );
}
