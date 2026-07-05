type Field<T> = Extract<keyof T, string>;

export type CellRenderer<T> = (value: unknown, row: T) => unknown;
export type GridNexaClassName =
  | string
  | string[]
  | null
  | undefined
  | false;

export type ColumnFilterKind = "text" | "number" | "date" | "set" | "multi";

export type ColumnEditorKind =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "largeText"
  | "select"
  | "advancedSelect";

export interface ColumnFilterOptions<T = unknown> {
  type?: ColumnFilterKind;
  values?: unknown[];
  filters?: ColumnFilterOptions<T>[];
  predicate?: (value: unknown, row: T, filterValue: unknown) => boolean;
}

export interface ColumnEditorOptions<T = unknown> {
  type?: ColumnEditorKind;
  values?: Array<
    | string
    | number
    | boolean
    | {
        value: string | number | boolean;
        label?: string;
        disabled?: boolean;
      }
  >;
  searchable?: boolean;
  allowCustomValue?: boolean;
  placeholder?: string;
  noOptionsText?: string;
  parseValue?: (value: string, row: T) => unknown;
}

export interface Column<T = unknown> {
  id: string;

  field: Field<T>;

  headerName: string;

  className?:
    | GridNexaClassName
    | ((params: { value: unknown; row: T; rowIndex: number; column: Column<T> }) => GridNexaClassName);

  cellClassName?:
    | GridNexaClassName
    | ((params: { value: unknown; row: T; rowIndex: number; column: Column<T> }) => GridNexaClassName);

  headerClassName?:
    | GridNexaClassName
    | ((params: { column: Column<T> }) => GridNexaClassName);

  width?: number;

  minWidth?: number;

  maxWidth?: number;

  flex?: number;

  sortable?: boolean;

  filterable?: boolean;

  filter?: ColumnFilterKind | ColumnFilterOptions<T>;

  editable?: boolean;

  editor?: ColumnEditorKind | ColumnEditorOptions<T>;

  resizable?: boolean;

  hidden?: boolean;

  pinned?: "left" | "right";

  cellRenderer?: CellRenderer<T>;

  valueFormatter?: (value: unknown) => string;

  valueGetter?: (row: T) => unknown;
}
