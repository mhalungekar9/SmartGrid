import type { Column } from "@smartgrid/core";

function evaluateFormula<T>(formula: string, row: T): unknown {
  const expression = formula.slice(1).trim();

  if (!expression) {
    return "";
  }

  const values = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const compiled = expression.replace(
    /\b[A-Za-z_][A-Za-z0-9_]*\b/g,
    (field) => {
      const value = values[field];
      const numberValue = Number(value);

      return Number.isFinite(numberValue) ? String(numberValue) : "0";
    },
  );

  if (!/^[\d+\-*/().%\s]+$/.test(compiled)) {
    return "#FORMULA!";
  }

  try {
    const result = Function(`"use strict"; return (${compiled});`)();

    return typeof result === "number" && Number.isFinite(result)
      ? result
      : "#FORMULA!";
  } catch {
    return "#FORMULA!";
  }
}

export function getRawColumnValue<T>(row: T, column: Column<T>): unknown {
  return column.valueGetter?.(row) ?? row[column.field];
}

export function getColumnValue<T>(row: T, column: Column<T>): unknown {
  const value = getRawColumnValue(row, column);

  if (typeof value === "string" && value.trim().startsWith("=")) {
    return evaluateFormula(value.trim(), row);
  }

  return value;
}
