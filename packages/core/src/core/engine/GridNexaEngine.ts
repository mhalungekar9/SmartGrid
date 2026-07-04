import { GridOptions } from "../../models/GridOptions";
import { GridState } from "../../models/GridState";
import { GridStateManager } from "../state/GridState";
import { EventBus } from "../events/EventBus";
import { GridApi } from "../api/GridApi";

export class GridNexaEngine<T = unknown> {
  private readonly stateManager: GridStateManager<T>;
  private readonly eventBus = new EventBus();
  private readonly api: GridApi<T>;

  constructor(options: GridOptions<T>) {
    const initialState: GridState<T> = {
      columns: options.columns,
      rows: options.rows,
    };

    this.stateManager = new GridStateManager(initialState);

    this.api = new GridApi(
      () => this.stateManager.getState(),
      (state) => this.stateManager.setState(state),
    );
  }

  public getState(): GridState<T> {
    return this.stateManager.getState();
  }

  public getVersion(): string {
    return "0.1.0";
  }

  public getApi(): GridApi<T> {
    return this.api;
  }

  public on(event: string, listener: (payload: unknown) => void): void {
    this.eventBus.on(event, listener);
  }

  public subscribe(listener: (state: GridState<T>) => void): () => void {
    return this.stateManager.subscribe(listener);
  }

  public setState(state: GridState<T>): void {
    this.stateManager.setState(state);
  }
}
