import type { Column } from "@smartgrid/core";
import { buildGridTemplate } from "./GridLayout";

export class GridRenderer<T> {
  constructor(private readonly columns: Column<T>[]) {}

  getTemplate(): string {
    return buildGridTemplate(this.columns);
  }
}
