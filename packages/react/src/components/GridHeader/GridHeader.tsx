import type { Column } from "@smartgrid/core";
import type { ColumnFilterModel } from "@smartgrid/core";
import { useGridContext } from "../../context/GridContext";
import { GridHeaderCell } from "../GridHeaderCell/GridHeaderCell";
import "./GridHeader.css";

interface Props<T> {
  columns: Column<T>[];
  widths: number[];
  sortModel: { columnId: string; direction: "asc" | "desc" } | null;
  onSort: (columnId: string) => void;
  onSortDirection: (columnId: string, direction: "asc" | "desc" | null) => void;
  onResizeStart: (columnId: string, startWidth: number, startX: number) => void;
  onAutoSize: (columnId: string) => void;
  filterModel: Record<string, ColumnFilterModel>;
  getColumnFilterType: (column: Column<T>) => ColumnFilterModel["type"];
  getColumnFilterValues: (column: Column<T>) => string[];
  onSetColumnFilter: (
    columnId: string,
    filter: ColumnFilterModel | null,
  ) => void;
  columnMenuColumnId: string | null;
  onColumnMenuOpenChange: (columnId: string, open: boolean) => void;
  onOpenFilters: (columnId: string) => void;
  onClearColumnFilter: (columnId: string) => void;
  onPinColumn: (columnId: string, pinned: "left" | "right" | null) => void;
  onHideColumn: (columnId: string) => void;
}

export function GridHeader<T>({
  columns,
  widths,
  sortModel,
  onSort,
  onSortDirection,
  onResizeStart,
  onAutoSize,
  filterModel,
  getColumnFilterType,
  getColumnFilterValues,
  onSetColumnFilter,
  columnMenuColumnId,
  onColumnMenuOpenChange,
  onOpenFilters,
  onClearColumnFilter,
  onPinColumn,
  onHideColumn,
}: Props<T>) {
  const { columnTemplate, rowNumbers } = useGridContext<T>();

  return (
    <div className="sg-header" style={{ gridTemplateColumns: columnTemplate }}>
      {rowNumbers ? (
        <div className="sg-header-cell sg-row-number-header" role="columnheader">
          #
        </div>
      ) : null}
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
            onSortDirection={onSortDirection}
            onResizeStart={onResizeStart}
            onAutoSize={onAutoSize}
            hasFilter={Boolean(filterModel[column.id])}
            filter={filterModel[column.id]}
            filterType={getColumnFilterType(column)}
            filterValues={getColumnFilterValues(column)}
            onSetFilter={onSetColumnFilter}
            menuOpen={columnMenuColumnId === column.id}
            onMenuOpenChange={onColumnMenuOpenChange}
            onOpenFilters={onOpenFilters}
            onClearFilter={onClearColumnFilter}
            onPinColumn={onPinColumn}
            onHideColumn={onHideColumn}
          />
        ))}
    </div>
  );
}
