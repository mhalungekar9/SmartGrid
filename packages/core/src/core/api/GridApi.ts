import { GridState } from "../../models/GridState";

export class GridApi<T = unknown> {
  constructor(private readonly getState: () => GridState<T>) {}

  public getVersion(): string {
    return "0.1.0";
  }

  public getRows(): T[] {
    return this.getState().rows;
  }

  public getColumns() {
    return this.getState().columns;
  }
}
