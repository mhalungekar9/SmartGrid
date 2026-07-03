import { GridState } from "../../models/GridState";
import type { Column } from "../../models/Column";

type SortDirection = "asc" | "desc";

export class GridApi<T = unknown> {
  constructor(
    private readonly getState: () => GridState<T>,
    private readonly setState: (state: GridState<T>) => void,
  ) {}

  public getVersion(): string {
    return "0.1.0";
  }

  public getRows(): T[] {
    return this.getState().rows;
  }

  public getColumns() {
    return this.getState().columns;
  }

  public setRows(rows: T[]): void {
    this.setState({ ...this.getState(), rows });
  }

  public setColumns(columns: Column<T>[]): void {
    this.setState({ ...this.getState(), columns });
  }

  public setColumnWidth(columnId: string, width: number): void {
    const state = this.getState();

    this.setState({
      ...state,
      columns: state.columns.map((column) =>
        column.id === columnId ? { ...column, width } : column,
      ),
    });
  }

  public setCellValue(
    rowIndex: number,
    columnId: string,
    value: unknown,
  ): void {
    const state = this.getState();
    const column = state.columns.find((entry) => entry.id === columnId);

    if (!column || !state.rows[rowIndex]) {
      return;
    }

    const nextRows = state.rows.map((row, index) => {
      if (index !== rowIndex) {
        return row;
      }

      return {
        ...row,
        [column.field]: value,
      };
    });

    this.setState({ ...state, rows: nextRows });
  }

  public sortBy(columnId: string, direction: SortDirection): void {
    const state = this.getState();
    const column = state.columns.find((entry) => entry.id === columnId);

    if (!column) {
      return;
    }

    const sortedRows = [...state.rows].sort((leftRow, rightRow) => {
      const leftValue =
        column.valueGetter?.(leftRow) ?? leftRow[column.field as keyof T];
      const rightValue =
        column.valueGetter?.(rightRow) ?? rightRow[column.field as keyof T];

      const leftText = String(leftValue ?? "");
      const rightText = String(rightValue ?? "");

      const comparison = leftText.localeCompare(rightText, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return direction === "asc" ? comparison : -comparison;
    });

    this.setState({ ...state, rows: sortedRows });
  }
}
