import type {
  AdvancedFilterModel,
  ColumnFilterModel,
  PivotAggregation,
} from "../models/GridOptions";

export type GridNexaCommandAction =
  | {
      type: "quickFilter";
      value: string;
    }
  | {
      type: "setColumnFilter";
      columnId: string;
      filter: ColumnFilterModel | null;
    }
  | {
      type: "setAdvancedFilter";
      model: AdvancedFilterModel | null;
    }
  | {
      type: "sort";
      columnId: string;
      direction: "asc" | "desc" | null;
    }
  | {
      type: "group";
      columnId: string | null;
    }
  | {
      type: "pivot";
      groupBy?: string | null;
      pivotBy?: string | null;
      valueColumns?: string[];
      aggregation?: PivotAggregation;
    }
  | {
      type: "pinColumn";
      columnId: string;
      pinned: "left" | "right" | null;
    }
  | {
      type: "hideColumn";
      columnId: string;
      hidden: boolean;
    }
  | {
      type: "export";
      format: "csv" | "excel";
    };

export interface GridNexaCommandPlan {
  id?: string;
  title: string;
  explanation?: string;
  actions: GridNexaCommandAction[];
  confidence?: number;
}

export interface GridNexaAiColumnContext {
  id: string;
  field: string;
  headerName: string;
  type?: string;
  hidden?: boolean;
  pinned?: "left" | "right";
}

export interface GridNexaAiGridState {
  columns: GridNexaAiColumnContext[];
  rowCount: number;
  sampleRows?: Array<Record<string, unknown>>;
  quickFilterText?: string;
  groupBy?: string;
  pivotBy?: string;
  pivotValueColumns?: string[];
  pivotAggregation?: PivotAggregation;
  activeColumnFilters?: Record<string, ColumnFilterModel>;
  advancedFilterModel?: AdvancedFilterModel | null;
}

export interface GridNexaAiRequest {
  prompt: string;
  state: GridNexaAiGridState;
}

export interface GridNexaAiResponse {
  plan: GridNexaCommandPlan;
}

export type GridNexaAiProvider = (
  request: GridNexaAiRequest,
) => Promise<GridNexaAiResponse | GridNexaCommandPlan>;

export interface GridNexaAiOptions {
  enabled?: boolean;
  placeholder?: string;
  provider?: GridNexaAiProvider;
  endpoint?: string;
  fetcher?: typeof fetch;
  sampleRowCount?: number;
  autoApply?: boolean;
  onPlan?: (plan: GridNexaCommandPlan) => void;
  onApply?: (plan: GridNexaCommandPlan) => void;
  onError?: (error: unknown) => void;
}

export interface GridCommand {
  execute(): void;

  undo(): void;
}
