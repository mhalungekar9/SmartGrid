import { createContext, useContext } from "react";

export interface GridContextValue<T> {
  rows: T[];
  columnTemplate: string;
}

const GridContext = createContext<GridContextValue<any> | null>(null);

export function useGridContext<T>() {
  const context = useContext(GridContext);

  if (!context) {
    throw new Error("GridContext not found");
  }

  return context as GridContextValue<T>;
}

export default GridContext;
