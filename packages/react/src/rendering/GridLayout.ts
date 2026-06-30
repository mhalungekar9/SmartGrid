import type { Column } from "@smartgrid/core";

export function buildGridTemplate<T>(columns: Column<T>[]): string {
  return columns.map((column) => `${column.width ?? 150}px`).join(" ");
}
