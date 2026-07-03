import type { Column } from "../../models/Column";

function clampWidth<T>(column: Column<T>, width: number): number {
  const minWidth = column.minWidth ?? 60;
  const maxWidth = column.maxWidth ?? 1000;

  return Math.max(minWidth, Math.min(maxWidth, width));
}

export function buildColumnLayout<T>(
  columns: Column<T>[],
  widths?: number[],
): string {
  return columns
    .filter((column) => !column.hidden)
    .map((column, index) => {
      const resolvedWidth = widths?.[index] ?? column.width ?? 150;

      if (column.flex && column.flex > 0) {
        const minWidth = column.minWidth ?? 60;

        return `minmax(${minWidth}px, ${column.flex}fr)`;
      }

      return `${clampWidth(column, resolvedWidth)}px`;
    })
    .join(" ");
}
