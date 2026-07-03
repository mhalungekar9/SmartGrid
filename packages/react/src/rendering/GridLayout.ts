import type { Column } from "@smartgrid/core";

export function buildGridTemplate<T>(
  columns: Column<T>[],
  widths?: number[],
): string {
  return columns
    .filter((column) => !column.hidden)
    .map((column, index) => {
      const width = widths?.[index] ?? column.width ?? 150;
      const minWidth = column.minWidth ?? 60;

      if (column.flex && column.flex > 0) {
        return `minmax(${minWidth}px, ${column.flex}fr)`;
      }

      return `${Math.max(minWidth, Math.min(column.maxWidth ?? 1000, width))}px`;
    })
    .join(" ");
}
