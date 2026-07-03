import { GridState } from "../../models/GridState";

export class GridStateManager<T = unknown> {
  private state: GridState<T>;
  private readonly listeners = new Set<(state: GridState<T>) => void>();

  constructor(initialState: GridState<T>) {
    this.state = initialState;
  }

  getState(): GridState<T> {
    return this.state;
  }

  setState(state: GridState<T>): void {
    this.state = state;
    this.listeners.forEach((listener) => listener(this.state));
  }

  updateState(updater: (state: GridState<T>) => GridState<T>): void {
    this.setState(updater(this.state));
  }

  subscribe(listener: (state: GridState<T>) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}
