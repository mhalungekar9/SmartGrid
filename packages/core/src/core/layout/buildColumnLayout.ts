import type { Column } from "../../models/Column";

export function buildColumnLayout<T>(columns: Column<T>[]): string {
  return columns.map((column) => `${column.width ?? 150}px`).join(" ");
}
