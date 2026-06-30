import type { GridOptions } from "@smartgrid/core";

import { GridRoot } from "../GridRoot/GridRoot";
import { GridHeader } from "../GridHeader/GridHeader";
import { GridBody } from "../GridBody/GridBody";

import { GridRenderer } from "../../rendering";

import GridContext from "../../context/GridContext";
import { buildColumnLayout } from "@smartgrid/core";

export interface SmartGridProps<T> extends GridOptions<T> {}

export function SmartGrid<T>({ rows, columns }: SmartGridProps<T>) {
  const renderer = new GridRenderer(columns);
  const template = renderer.getTemplate();

  return (
    <GridContext.Provider
      value={{
        rows,
        columnTemplate: template,
      }}
    >
      <GridRoot>
        <GridHeader columns={columns} />
        <GridBody rows={rows} columns={columns} />
      </GridRoot>
    </GridContext.Provider>
  );
}
