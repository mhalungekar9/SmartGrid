import type { Column } from "@gridnexa/core";
import { buildGridTemplate } from "./GridLayout";

export class GridRenderer<T> {
  constructor(
    private readonly columns: Column<T>[],
    private readonly widths?: number[],
  ) {}

  getTemplate(): string {
    return buildGridTemplate(this.columns, this.widths);
  }
}
