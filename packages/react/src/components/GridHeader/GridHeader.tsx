import type { Column } from "@gridnexa/core";
import type { ColumnFilterModel, MergedHeader } from "@gridnexa/core";
import { cx, useGridContext } from "../../context/GridContext";
import { GridHeaderCell } from "../GridHeaderCell/GridHeaderCell";
import "./GridHeader.css";

interface Props<T> {
  columns: Column<T>[];
  widths: number[];
  mergedHeaders?: MergedHeader[];
  sortModel: { columnId: string; direction: "asc" | "desc" } | null;
  onSort: (columnId: string) => void;
  onSortDirection: (columnId: string, direction: "asc" | "desc" | null) => void;
  onResizeStart: (columnId: string, startWidth: number, startX: number) => void;
  onAutoSize: (columnId: string) => void;
  draggedColumnId: string | null;
  dropTargetColumnId: string | null;
  onColumnDragStart: (columnId: string) => void;
  onColumnDragOver: (columnId: string) => void;
  onColumnDrop: (sourceColumnId: string, targetColumnId: string) => void;
  onColumnDragEnd: () => void;
  filterModel: Record<string, ColumnFilterModel>;
  getColumnFilterType: (column: Column<T>) => ColumnFilterModel["type"];
  getColumnFilterValues: (column: Column<T>) => string[];
  onSetColumnFilter: (
    columnId: string,
    filter: ColumnFilterModel | null,
  ) => void;
  filterPopoverColumnId: string | null;
  onFilterPopoverOpenChange: (columnId: string, open: boolean) => void;
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
  mergedHeaders,
  sortModel,
  onSort,
  onSortDirection,
  onResizeStart,
  onAutoSize,
  draggedColumnId,
  dropTargetColumnId,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
  filterModel,
  getColumnFilterType,
  getColumnFilterValues,
  onSetColumnFilter,
  filterPopoverColumnId,
  onFilterPopoverOpenChange,
  columnMenuColumnId,
  onColumnMenuOpenChange,
  onOpenFilters,
  onClearColumnFilter,
  onPinColumn,
  onHideColumn,
}: Props<T>) {
  const {
    allVisibleRowsSelected,
    checkboxSelection,
    columnTemplate,
    classNames,
    rowNumbers,
    someVisibleRowsSelected,
    toggleAllRowsSelection,
  } = useGridContext<T>();
  const visibleColumns = columns.filter((column) => !column.hidden);
  const leadingColumnCount = Number(checkboxSelection) + Number(rowNumbers);
  const mergedHeaderCells = (mergedHeaders ?? [])
    .map((mergedHeader) => {
      const visibleIndexes = mergedHeader.columnIds
        .map((columnId) =>
          visibleColumns.findIndex((column) => column.id === columnId),
        )
        .filter((index) => index >= 0);

      if (!visibleIndexes.length) {
        return null;
      }

      const startIndex = Math.min(...visibleIndexes);
      const endIndex = Math.max(...visibleIndexes);

      return {
        ...mergedHeader,
        gridColumn: `${leadingColumnCount + startIndex + 1} / span ${
          endIndex - startIndex + 1
        }`,
      };
    })
    .filter(Boolean) as Array<MergedHeader & { gridColumn: string }>;

  return (
    <div className={cx("sg-header", classNames.header)}>
      {mergedHeaderCells.length ? (
        <div
          className={cx("sg-merged-header-row", classNames.mergedHeaderRow)}
          style={{ gridTemplateColumns: columnTemplate }}
        >
          {mergedHeaderCells.map((mergedHeader) => (
            <div
              className={cx("sg-merged-header-cell", classNames.mergedHeaderCell)}
              data-align={mergedHeader.align ?? "center"}
              key={mergedHeader.id}
              role="columnheader"
              style={{ gridColumn: mergedHeader.gridColumn }}
            >
              {mergedHeader.headerName}
            </div>
          ))}
        </div>
      ) : null}
      <div
        className={cx("sg-column-header-row", classNames.headerRow)}
        style={{ gridTemplateColumns: columnTemplate }}
      >
        {checkboxSelection ? (
          <div
            className={cx("sg-header-cell sg-selection-header", classNames.headerCell)}
            role="columnheader"
            aria-label="Select rows"
          >
            <input
              className="sg-selection-checkbox"
              type="checkbox"
              checked={allVisibleRowsSelected}
              ref={(element) => {
                if (element) {
                  element.indeterminate =
                    someVisibleRowsSelected && !allVisibleRowsSelected;
                }
              }}
              aria-label={
                allVisibleRowsSelected
                  ? "Clear row selection"
                  : "Select all rows"
              }
              onChange={toggleAllRowsSelection}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ) : null}
        {rowNumbers ? (
          <div
            className={cx("sg-header-cell sg-row-number-header", classNames.headerCell)}
            role="columnheader"
          >
            #
          </div>
        ) : null}
        {visibleColumns.map((column, index) => (
          <GridHeaderCell
            key={column.id}
            column={column}
            columnIndex={index}
            width={widths[index]}
            sortDirection={
              sortModel?.columnId === column.id ? sortModel.direction : null
            }
            onSort={onSort}
            onSortDirection={onSortDirection}
            onResizeStart={onResizeStart}
            onAutoSize={onAutoSize}
            isDragging={draggedColumnId === column.id}
            isDropTarget={dropTargetColumnId === column.id}
            onColumnDragStart={onColumnDragStart}
            onColumnDragOver={onColumnDragOver}
            onColumnDrop={onColumnDrop}
            onColumnDragEnd={onColumnDragEnd}
            hasFilter={Boolean(filterModel[column.id])}
            filter={filterModel[column.id]}
            filterType={getColumnFilterType(column)}
            filterValues={getColumnFilterValues(column)}
            onSetFilter={onSetColumnFilter}
            filterOpen={filterPopoverColumnId === column.id}
            onFilterOpenChange={onFilterPopoverOpenChange}
            menuOpen={columnMenuColumnId === column.id}
            onMenuOpenChange={onColumnMenuOpenChange}
            onOpenFilters={onOpenFilters}
            onClearFilter={onClearColumnFilter}
            onPinColumn={onPinColumn}
            onHideColumn={onHideColumn}
          />
        ))}
      </div>
    </div>
  );
}
