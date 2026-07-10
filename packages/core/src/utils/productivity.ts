import type {
  GridNexaDiagnosticsOptions,
  GridNexaSavedViewsOptions,
  GridNexaValidationOptions,
  GridNexaValidationRule,
} from "../models/GridOptions";

export const GRIDNEXA_DEFAULT_VIEW_ID = "__gridnexa_default_view__";

export type GridNexaDomSavedView<TState = unknown> = {
  id: string;
  name: string;
  state: TState;
  createdAt: number;
  updatedAt?: number;
  system?: boolean;
};

export type GridNexaDomChangeEntry = {
  id: string;
  type: "edit" | "add" | "delete" | "bulkDelete";
  label: string;
  timestamp: number;
};

export function resolveGridNexaEnabled(value: unknown) {
  if (!value) return false;
  if (value === true) return true;
  return typeof value === "object" ? ((value as { enabled?: boolean }).enabled ?? true) : false;
}

export function resolveGridNexaSavedViews(value?: GridNexaSavedViewsOptions) {
  if (!value) return { enabled: false, key: "", allowUserViews: false };
  if (value === true) return { enabled: true, key: "gridnexa-views", allowUserViews: true };
  return {
    enabled: value.enabled ?? true,
    key: value.key ?? "gridnexa-views",
    allowUserViews: value.allowUserViews ?? true,
  };
}

export function readGridNexaSavedViews<TState>(key: string): Array<GridNexaDomSavedView<TState>> {
  if (!key || typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGridNexaSavedViews<TState>(key: string, views: Array<GridNexaDomSavedView<TState>>) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(views));
  } catch {
    // Preferences should not block grid work.
  }
}

export function resolveGridNexaValidation(value?: GridNexaValidationOptions) {
  const enabled = resolveGridNexaEnabled(value);
  return {
    enabled,
    blockSave: enabled && typeof value === "object" ? value.blockSave === true : false,
    showSummary: enabled && typeof value === "object" ? value.showSummary !== false : enabled,
    rules: enabled && typeof value === "object" ? (value.rules ?? {}) : {},
  };
}

export function getGridNexaValidationMessage(rule: GridNexaValidationRule | undefined, value: unknown, row: unknown) {
  if (!rule) return "";
  if (rule === true) return value == null || String(value).trim() === "" ? "Required" : "";
  if (rule.required && (value == null || String(value).trim() === "")) return rule.message ?? "Required";
  if (rule.type === "number" && value != null && value !== "" && !Number.isFinite(Number(value))) return rule.message ?? "Must be a number";
  if (rule.type === "email" && value != null && value !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return rule.message ?? "Must be an email";
  if (rule.min != null && Number(value) < rule.min) return rule.message ?? `Must be >= ${rule.min}`;
  if (rule.max != null && Number(value) > rule.max) return rule.message ?? `Must be <= ${rule.max}`;
  if (rule.pattern && value != null && value !== "") {
    const pattern = typeof rule.pattern === "string" ? new RegExp(rule.pattern) : rule.pattern;
    if (!pattern.test(String(value))) return rule.message ?? "Invalid value";
  }
  const custom = rule.validate?.(value, row);
  return custom === true || custom == null ? "" : custom;
}

export function shouldShowGridNexaDiagnostics(value?: GridNexaDiagnosticsOptions) {
  return resolveGridNexaEnabled(value) && typeof value === "object" && value.showPanel === true;
}
