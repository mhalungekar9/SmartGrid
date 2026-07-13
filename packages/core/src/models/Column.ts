type Field<T> = Extract<keyof T, string>;

export type CellRenderer<T> = (value: unknown, row: T) => unknown;
export type GridNexaClassName =
  | string
  | string[]
  | null
  | undefined
  | false;

export type ColumnFilterKind = "text" | "number" | "date" | "set" | "multi";

export type GridNexaColumnToolName =
  | "sort"
  | "filter"
  | "filterPanel"
  | "menu"
  | "resize"
  | "pin"
  | "hide"
  | "autosize"
  | "columnSelector"
  | (string & {});

export type GridNexaColumnToolOptions =
  | boolean
  | Partial<Record<GridNexaColumnToolName, boolean>>;

export interface GridNexaTextDisplayOptions {
  overflow?: "ellipsis" | "wrap" | "clip";
  showTooltip?: boolean;
  lineClamp?: number;
  minWidth?: number;
}

export type GridNexaColumnStyleValue = string | number | undefined;
export type GridNexaColumnStyleObject = Partial<{
  fontFamily: GridNexaColumnStyleValue;
  fontSize: GridNexaColumnStyleValue;
  fontWeight: GridNexaColumnStyleValue;
  lineHeight: GridNexaColumnStyleValue;
  color: GridNexaColumnStyleValue;
  background: GridNexaColumnStyleValue;
  backgroundColor: GridNexaColumnStyleValue;
  borderColor: GridNexaColumnStyleValue;
  padding: GridNexaColumnStyleValue;
  paddingInline: GridNexaColumnStyleValue;
  paddingBlock: GridNexaColumnStyleValue;
  textAlign: "left" | "center" | "right";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing: GridNexaColumnStyleValue;
  iconSize: GridNexaColumnStyleValue;
  height: GridNexaColumnStyleValue;
}>;

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

  headerStyle?: GridNexaColumnStyleObject;

  cellStyle?:
    | GridNexaColumnStyleObject
    | ((params: { value: unknown; row: T; rowIndex: number; column: Column<T> }) => GridNexaColumnStyleObject);

  width?: number;

  minWidth?: number;

  maxWidth?: number;

  flex?: number;

  sortable?: boolean;

  filterable?: boolean;

  tools?: GridNexaColumnToolOptions;

  icons?: Record<string, unknown>;

  textDisplay?: GridNexaTextDisplayOptions;

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
