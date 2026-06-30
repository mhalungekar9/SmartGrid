import { Field } from "../types/Field";

export interface Column<T = unknown> {
  id: string;

  field: Field<T>;

  headerName: string;

  width?: number;

  minWidth?: number;

  maxWidth?: number;

  sortable?: boolean;

  filterable?: boolean;

  editable?: boolean;

  resizable?: boolean;

  hidden?: boolean;
}
