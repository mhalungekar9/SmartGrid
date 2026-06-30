type Field<T> = Extract<keyof T, string>;

export type CellRenderer<T> = (value: unknown, row: T) => unknown;

export interface Column<T = unknown> {
  id: string;

  field: Field<T>;

  headerName: string;

  width?: number;

  minWidth?: number;

  maxWidth?: number;

  flex?: number;

  sortable?: boolean;

  filterable?: boolean;

  editable?: boolean;

  resizable?: boolean;

  hidden?: boolean;

  pinned?: "left" | "right";

  cellRenderer?: CellRenderer<T>;

  valueFormatter?: (value: unknown) => string;

  valueGetter?: (row: T) => unknown;
}
