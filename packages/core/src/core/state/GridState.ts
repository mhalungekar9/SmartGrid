import { GridState } from "../../models/GridState";

export class GridStateManager<T = unknown> {
  private state: GridState<T>;

  constructor(initialState: GridState<T>) {
    this.state = initialState;
  }

  getState(): GridState<T> {
    return this.state;
  }

  setState(state: GridState<T>): void {
    this.state = state;
  }
}
