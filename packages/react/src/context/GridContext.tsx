import { createContext, useContext } from "react";
import type { CSSProperties } from "react";
import type {
  Column,
  GridNexaClassName,
  GridNexaRowReorderPosition,
  GridNexaSlotClassNames,
  GridNexaTheme,
} from "@gridnexa/core";

export function cx(...values: GridNexaClassName[]): string {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(" ");
}

export interface GridContextValue<T> {
  rows: T[];
  columns: Column<T>[];
  theme: GridNexaTheme;
  classNames: GridNexaSlotClassNames;
  columnTemplate: string;
  tableMinWidth: number;
  selectedRowIndex: number | null;
  onRowSelect: (rowIndex: number) => void;
  emitRowDoubleClick: (rowIndex: number) => void;
  selectedRowIds: Set<string | number>;
  checkboxSelection: boolean;
  allVisibleRowsSelected: boolean;
  someVisibleRowsSelected: boolean;
  getRowSelectionId: (row: T, rowIndex: number) => string | number;
  toggleRowSelection: (row: T, rowIndex: number) => void;
  toggleAllRowsSelection: () => void;
  rowNumbers: boolean;
  enableRowReorder: boolean;
  rowReorderPosition: GridNexaRowReorderPosition;
  getColumnStyle: (columnId: string) => CSSProperties;
  selectionColumnStyle: CSSProperties | undefined;
  rowNumberColumnStyle: CSSProperties | undefined;
  getRowClassName: (params: {
    row: T;
    rowIndex: number;
    selected: boolean;
  }) => GridNexaClassName;
  getCellClassName: (params: {
    value: unknown;
    row: T;
    rowIndex: number;
    column: Column<T>;
    columnIndex: number;
    selected: boolean;
  }) => GridNexaClassName;
  getHeaderClassName: (params: {
    column: Column<T>;
    columnIndex: number;
  }) => GridNexaClassName;
  emitCellClick: (rowIndex: number, columnIndex: number) => void;
  emitCellDoubleClick: (rowIndex: number, columnIndex: number) => void;
  activeCell: { rowIndex: number; columnIndex: number } | null;
  selectionAnchor: { rowIndex: number; columnIndex: number } | null;
  setActiveCell: (rowIndex: number, columnIndex: number) => void;
  setSelectionAnchor: (rowIndex: number, columnIndex: number) => void;
  moveActiveCell: (
    rowDelta: number,
    columnDelta: number,
    extend?: boolean,
  ) => void;
  clearSelectionAnchor: () => void;
  copySelection: () => Promise<void> | void;
  pasteSelection: (text: string) => void;
  fillSelection: () => void;
  findMatch: { rowIndex: number; columnIndex: number } | null;
  openCellContextMenu: (
    rowIndex: number,
    columnIndex: number,
    x: number,
    y: number,
  ) => void;
  draggedRowIndex: number | null;
  dropTargetRowIndex: number | null;
  editingCell: {
    rowIndex: number;
    columnId: string;
    draftValue: string;
  } | null;
  startCellEdit: (rowIndex: number, columnId: string, value: string) => void;
  updateCellDraft: (value: string) => void;
  commitCellEdit: () => void;
  cancelCellEdit: () => void;
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
