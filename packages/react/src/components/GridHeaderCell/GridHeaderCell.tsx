import type { Column } from "@gridnexa/core";
import type { ColumnFilterModel } from "@gridnexa/core";
import { createElement, type ComponentType, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronsLeft,
  ChevronsRight,
  EyeOff,
  Filter,
  Maximize2,
  MoreVertical,
  PinOff,
  SlidersHorizontal,
  X,
} from "lucide-react";
import "./GridHeaderCell.css";
import { cx, useGridContext } from "../../context/GridContext";

function renderIcon(icon: unknown, fallback: ReactNode) {
  if (!icon) {
    return fallback;
  }

  if (typeof icon === "function") {
    return createElement(icon as ComponentType<{ size?: number }>, {
      size: 15,
    });
  }

  return icon as ReactNode;
}

interface Props<T> {
  column: Column<T>;
  columnIndex: number;
  width: number;
  sortDirection: "asc" | "desc" | null;
  onSort: (columnId: string) => void;
  onSortDirection: (columnId: string, direction: "asc" | "desc" | null) => void;
  onResizeStart: (columnId: string, startWidth: number, startX: number) => void;
  onAutoSize: (columnId: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onColumnDragStart: (columnId: string) => void;
  onColumnDragOver: (columnId: string) => void;
  onColumnDrop: (sourceColumnId: string, targetColumnId: string) => void;
  onColumnDragEnd: () => void;
  hasFilter: boolean;
  filter: ColumnFilterModel | undefined;
  filterType: ColumnFilterModel["type"];
  filterValues: string[];
  onSetFilter: (columnId: string, filter: ColumnFilterModel | null) => void;
  filterOpen: boolean;
  onFilterOpenChange: (columnId: string, open: boolean) => void;
  menuOpen: boolean;
  onMenuOpenChange: (columnId: string, open: boolean) => void;
  onOpenFilters: (columnId: string) => void;
  onClearFilter: (columnId: string) => void;
  onPinColumn: (columnId: string, pinned: "left" | "right" | null) => void;
  onHideColumn: (columnId: string) => void;
}

export function GridHeaderCell<T>({
  column,
  columnIndex,
  width,
  sortDirection,
  onSort,
  onSortDirection,
  onResizeStart,
  onAutoSize,
  isDragging,
  isDropTarget,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
  hasFilter,
  filter,
  filterType,
  filterValues,
  onSetFilter,
  filterOpen,
  onFilterOpenChange,
  menuOpen,
  onMenuOpenChange,
  onOpenFilters,
  onClearFilter,
  onPinColumn,
  onHideColumn,
}: Props<T>) {
  const { classNames, getColumnStyle, getHeaderClassName, getColumnTools, getColumnIcons, icons, theme } =
    useGridContext<T>();
  const tools = getColumnTools(column);
  const columnIcons = { ...icons, ...getColumnIcons(column) };
  const popupThemeClass = `sg-popup-theme-${theme}`;
  const selectedSetValues = (filter?.values ?? []).map(String);
  const toggleSetFilterValue = (value: string) => {
    const nextValues = selectedSetValues.includes(value)
      ? selectedSetValues.filter((entry) => entry !== value)
      : [...selectedSetValues, value];

    onSetFilter(
      column.id,
      nextValues.length
        ? { type: "set", operator: "in", values: nextValues }
        : null,
    );
  };
  const sortLabel =
    sortDirection === "asc"
      ? "Sort descending"
      : sortDirection === "desc"
        ? "Clear sort"
        : "Sort ascending";
  const columnStyle = getColumnStyle(column.id);
  const pinnedSide =
    column.pinned ??
    (columnStyle.left !== undefined
      ? "left"
      : columnStyle.right !== undefined
        ? "right"
        : undefined);

  return (
    <div
      className={cx(
        "sg-header-cell",
        isDragging && "sg-header-cell--dragging",
        isDropTarget && "sg-header-cell--drop-target",
        classNames.headerCell,
        typeof column.headerClassName === "function"
          ? column.headerClassName({ column })
          : column.headerClassName,
        getHeaderClassName({ column, columnIndex }),
      )}
      role="columnheader"
      draggable={tools.menu}
      data-gnx-draggable={tools.menu ? "true" : undefined}
      aria-sort={
        sortDirection
          ? sortDirection === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      data-gnx-pinned={pinnedSide}
      style={columnStyle}
      onDragStart={(event) => {
        if (!tools.menu) {
          event.preventDefault();
          return;
        }

        const target = event.target as HTMLElement | null;

        if (target?.closest("button, input, select, textarea, .sg-resize-handle")) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", column.id);
        onColumnDragStart(column.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onColumnDragOver(column.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceColumnId = event.dataTransfer.getData("text/plain");

        if (sourceColumnId) {
          onColumnDrop(sourceColumnId, column.id);
        }
      }}
      onDragEnd={onColumnDragEnd}
    >
      {tools.menu ? <span className="sg-column-drag-handle" aria-hidden="true" /> : null}
      <span className="sg-header-label">{column.headerName}</span>

      <div className="sg-header-actions">
        {tools.sort ? (
        <button
          className="sg-header-icon-button"
          type="button"
          title={sortLabel}
          aria-label={`${sortLabel}: ${column.headerName}`}
          onClick={(event) => {
            event.stopPropagation();
            onSort(column.id);
          }}
          disabled={column.sortable === false}
        >
          {sortDirection === "desc"
            ? renderIcon(columnIcons.sortDesc, <ArrowDownAZ size={15} strokeWidth={2} />)
            : renderIcon(columnIcons.sortAsc, <ArrowUpAZ size={15} strokeWidth={2} />)}
        </button>
        ) : null}

        {tools.filter ? (
        <Popover.Root
          open={filterOpen}
          onOpenChange={(open) => {
            if (open) {
              onMenuOpenChange(column.id, false);
            }

            onFilterOpenChange(column.id, open);
          }}
        >
          <Popover.Trigger asChild>
            <button
              className={`sg-header-icon-button${hasFilter ? " sg-header-icon-button--active" : ""}`}
              type="button"
              title={hasFilter ? "Edit filter" : "Add filter"}
              aria-label={`${hasFilter ? "Edit filter" : "Add filter"}: ${column.headerName}`}
              onClick={(event) => event.stopPropagation()}
              disabled={column.filterable === false}
            >
              {renderIcon(columnIcons.filter, <Filter size={15} strokeWidth={2} />)}
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              className={cx(
                "sg-header-menu sg-column-filter-popover",
                popupThemeClass,
              )}
              align="end"
              alignOffset={0}
              side="bottom"
              sideOffset={8}
              avoidCollisions
              collisionPadding={12}
              onClick={(event) => event.stopPropagation()}
              onInteractOutside={() => onFilterOpenChange(column.id, false)}
              onEscapeKeyDown={() => onFilterOpenChange(column.id, false)}
            >
              <div className="sg-column-filter-title">
                {renderIcon(columnIcons.columnTools, <SlidersHorizontal size={15} />)}
                <span>{column.headerName}</span>
              </div>

              {filterType === "set" ? (
                <div className="sg-column-filter-set" role="group">
                  {filterValues.map((value) => (
                    <label className="sg-column-filter-option" key={value}>
                      <input
                        type="checkbox"
                        checked={selectedSetValues.includes(value)}
                        onChange={() => toggleSetFilterValue(value)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <>
                  <select
                    className="sg-column-filter-input"
                    value={filter?.operator ?? "contains"}
                    onChange={(event) =>
                      onSetFilter(column.id, {
                        ...(filter ?? {}),
                        type: filterType,
                        operator: event.target
                          .value as ColumnFilterModel["operator"],
                      })
                    }
                  >
                    {(filterType === "number"
                      ? ["equals", "gt", "gte", "lt", "lte", "between"]
                      : filterType === "date"
                        ? ["equals", "before", "after", "between"]
                        : ["contains", "equals", "startsWith", "endsWith"]
                    ).map((operator) => (
                      <option key={operator} value={operator}>
                        {operator}
                      </option>
                    ))}
                  </select>
                  <input
                    className="sg-column-filter-input"
                    type={
                      filterType === "number"
                        ? "number"
                        : filterType === "date"
                          ? "date"
                          : "search"
                    }
                    value={String(filter?.value ?? "")}
                    onChange={(event) =>
                      onSetFilter(column.id, {
                        ...(filter ?? { operator: "contains" }),
                        type: filterType,
                        value: event.target.value,
                      })
                    }
                    placeholder="Filter value"
                  />
                  {filter?.operator === "between" ? (
                    <input
                      className="sg-column-filter-input"
                      type={filterType === "date" ? "date" : "number"}
                      value={String(filter.valueTo ?? "")}
                      onChange={(event) =>
                        onSetFilter(column.id, {
                          ...filter,
                          type: filterType,
                          valueTo: event.target.value,
                        })
                      }
                      placeholder="To"
                    />
                  ) : null}
                </>
              )}

              <div className="sg-column-filter-actions">
                <button
                  className="sg-column-filter-button"
                  type="button"
                  onClick={() => onSetFilter(column.id, null)}
                  disabled={!hasFilter}
                >
                  Clear
                </button>
                <Popover.Close asChild>
                  <button className="sg-column-filter-button" type="button">
                    Done
                  </button>
                </Popover.Close>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        ) : null}

        {tools.filterPanel ? (
        <button
          className="sg-header-icon-button"
          type="button"
          title="Open filters panel"
          aria-label={`Open filters panel: ${column.headerName}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenFilters(column.id);
          }}
          disabled={column.filterable === false}
        >
          {renderIcon(columnIcons.columnTools, <SlidersHorizontal size={15} strokeWidth={2} />)}
        </button>
        ) : null}

        {tools.menu ? (
        <DropdownMenu.Root
          modal={false}
          open={menuOpen}
          onOpenChange={(open) => onMenuOpenChange(column.id, open)}
        >
          <DropdownMenu.Trigger asChild>
            <button
              className="sg-header-icon-button"
              type="button"
              title="Column menu"
              aria-label={`Column menu: ${column.headerName}`}
              onClick={(event) => event.stopPropagation()}
            >
              {renderIcon(columnIcons.menu, <MoreVertical size={15} strokeWidth={2.2} />)}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={cx("sg-header-menu", popupThemeClass)}
              align="end"
              alignOffset={0}
              side="bottom"
              sideOffset={8}
              avoidCollisions
              collisionPadding={12}
              onClick={(event) => event.stopPropagation()}
            >
              {tools.sort ? (
              <>
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onSortDirection(column.id, "asc")}
                disabled={column.sortable === false}
              >
                {renderIcon(columnIcons.sortAsc, <ArrowUpAZ size={15} />)}
                <span>Sort ascending</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onSortDirection(column.id, "desc")}
                disabled={column.sortable === false}
              >
                {renderIcon(columnIcons.sortDesc, <ArrowDownAZ size={15} />)}
                <span>Sort descending</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onSortDirection(column.id, null)}
              >
                {renderIcon(columnIcons.clear, <X size={15} />)}
                <span>Clear sort</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="sg-header-menu-divider" />
              </>
              ) : null}
              {tools.filterPanel ? (
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onOpenFilters(column.id)}
                disabled={column.filterable === false}
              >
                {renderIcon(columnIcons.columnTools, <SlidersHorizontal size={15} />)}
                <span>{hasFilter ? "Edit filter" : "Filter column"}</span>
              </DropdownMenu.Item>
              ) : null}
              {tools.filter ? (
              <DropdownMenu.Item
                className="sg-header-menu-item"
                disabled={!hasFilter}
                onSelect={() => onClearFilter(column.id)}
              >
                {renderIcon(columnIcons.filter, <Filter size={15} />)}
                <span>Clear filter</span>
              </DropdownMenu.Item>
              ) : null}
              {(tools.filter || tools.filterPanel) ? (
              <DropdownMenu.Separator className="sg-header-menu-divider" />
              ) : null}
              {tools.pin ? (
              <>
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onPinColumn(column.id, "left")}
              >
                {renderIcon(columnIcons.pinLeft, <ChevronsLeft size={15} />)}
                <span>Pin left</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onPinColumn(column.id, "right")}
              >
                {renderIcon(columnIcons.pinRight, <ChevronsRight size={15} />)}
                <span>Pin right</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onPinColumn(column.id, null)}
              >
                {renderIcon(columnIcons.unpin, <PinOff size={15} />)}
                <span>Unpin</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="sg-header-menu-divider" />
              </>
              ) : null}
              {tools.autosize ? (
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onAutoSize(column.id)}
              >
                {renderIcon(columnIcons.autoSize, <Maximize2 size={15} />)}
                <span>Auto-size</span>
              </DropdownMenu.Item>
              ) : null}
              {tools.hide ? (
              <DropdownMenu.Item
                className="sg-header-menu-item"
                onSelect={() => onHideColumn(column.id)}
              >
                {renderIcon(columnIcons.hideColumn, <EyeOff size={15} />)}
                <span>Hide column</span>
              </DropdownMenu.Item>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        ) : null}
      </div>

      {tools.resize ? (
      <div
        className="sg-resize-handle"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onResizeStart(column.id, width, event.clientX);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAutoSize(column.id);
        }}
      />
      ) : null}
    </div>
  );
}
