import type { Column } from "@gridnexa/core";

export function buildGridTemplate<T>(
  columns: Column<T>[],
  widths?: number[],
): string {
  const visibleColumns = columns.filter((column) => !column.hidden);

  return visibleColumns
    .map((column, index) => {
      const width = widths?.[index] ?? column.width ?? 150;
      const minWidth = column.minWidth ?? 60;
      const resolvedWidth = Math.max(
        minWidth,
        Math.min(column.maxWidth ?? 1000, width),
      );

      if (column.flex && column.flex > 0) {
        return `minmax(${minWidth}px, ${column.flex}fr)`;
      }

      if (index === visibleColumns.length - 1) {
        return `minmax(${resolvedWidth}px, 1fr)`;
      }

      return `${resolvedWidth}px`;
    })
    .join(" ");
}
